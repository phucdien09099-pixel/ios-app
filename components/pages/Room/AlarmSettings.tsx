"use client";

import { useEffect, useState } from "react";
import {
    Cancel01Icon,
    Notification03Icon,
    VolumeHighIcon,
    VolumeLowIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { useTransport } from "@/components/providers/transport/TransportProvider";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { configRepo } from "@/db/repository/ConfigRepository";
import { deviceRepo } from "@/db/repository/DeviceRepository";

type AlarmMode =
    | "SHORT_BEEP"
    | "LONG_BEEP"
    | "SLOW"
    | "FAST"
    | "SIREN"
    | "AMBULANCE"
    | "WAKEUP";

const ALARM_MODES: { value: AlarmMode; label: string }[] = [
    { value: "SHORT_BEEP", label: "Bíp ngắn" },
    { value: "LONG_BEEP", label: "Bíp dài" },
    { value: "SLOW", label: "Cảnh báo chậm" },
    { value: "FAST", label: "Cảnh báo nhanh" },
    { value: "SIREN", label: "Còi báo động" },
    { value: "AMBULANCE", label: "Còi cứu thương" },
    { value: "WAKEUP", label: "Báo thức tăng dần" },
];

const ALARM_DURATIONS = [
    { value: "1", label: "1 phút" },
    { value: "5", label: "5 phút" },
    { value: "30", label: "30 phút" },
] as const;

const WEEKDAYS = [
    { value: "1", label: "T2" },
    { value: "2", label: "T3" },
    { value: "3", label: "T4" },
    { value: "4", label: "T5" },
    { value: "5", label: "T6" },
    { value: "6", label: "T7" },
    { value: "0", label: "CN" },
] as const;

const ALL_WEEKDAYS = WEEKDAYS.map((day) => day.value);

const getSliderNumber = (value: number | readonly number[]) =>
    Array.isArray(value) ? value[0] ?? 0 : value;

const addMinutes = (time: string, minutes: number) => {
    const [hour, minute] = time.split(":").map(Number);
    const totalMinutes = (hour * 60 + minute + minutes) % (24 * 60);

    return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
};

export default function AlarmSettings({ roomId, roomName }: { roomId: string; roomName: string }) {
    const { send } = useTransport();
    const [mode, setMode] = useState<AlarmMode>("WAKEUP");
    const [volume, setVolume] = useState(70);
    const [isSending, setIsSending] = useState(false);
    const [alarmOnTime, setAlarmOnTime] = useState("07:00");
    const [alarmDurationMinutes, setAlarmDurationMinutes] = useState(5);
    const [hubDeviceId, setHubDeviceId] = useState<string | null>(null);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [selectedDays, setSelectedDays] = useState<string[]>([...ALL_WEEKDAYS]);

    const alarmEndTime = addMinutes(alarmOnTime, alarmDurationMinutes);

    useEffect(() => {
        const loadSchedule = async () => {
            const hubs = await deviceRepo.getByHubDevice(roomId);
            const hub = hubs[0];
            if (!hub) return;

            setHubDeviceId(hub.id);

            const configs = await configRepo.getByDevice(hub.id);
            const onConfig = configs.find((config) => config.config_type === "ALARM_ON");
            if (!onConfig) return;

            setAlarmOnTime(onConfig.trigger_time);

            if (typeof onConfig.duration_minutes === "number" && onConfig.duration_minutes > 0) {
                setAlarmDurationMinutes(onConfig.duration_minutes);
            }

            try {
                const savedDays = JSON.parse(onConfig.days_of_week) as number[];
                setSelectedDays(savedDays.length > 0 ? savedDays.map(String) : [...ALL_WEEKDAYS]);
            } catch {
                setSelectedDays([...ALL_WEEKDAYS]);
            }

            try {
                const action = onConfig.action ? JSON.parse(onConfig.action) : null;
                if (action?.value) setMode(action.value as AlarmMode);
                if (typeof action?.volume === "number") setVolume(action.volume);
                if (typeof action?.durationMinutes === "number") {
                    setAlarmDurationMinutes(action.durationMinutes);
                }
            } catch {
                // Keep defaults when an older local config cannot be parsed.
            }
        };

        void loadSchedule();
    }, [roomId]);

    const sendAlarm = async (nextMode: AlarmMode | "OFF") => {
        setIsSending(true);
        try {
            await send(
                {
                    mode: nextMode,
                    volumn: volume,
                },
                `device/${roomName}/alarm/set`
            );
            toast.success(nextMode === "OFF" ? "Đã tắt báo thức" : "Đã gửi cấu hình báo thức");
        } catch (error) {
            console.error("Không thể cấu hình báo thức:", error);
            toast.error("Không thể gửi cấu hình báo thức đến Hub");
        } finally {
            setIsSending(false);
        }
    };

    const saveAlarmSchedule = async () => {
        if (!hubDeviceId) {
            toast.error("Khu vực này chưa có Hub để cài báo thức");
            return;
        }
        if (selectedDays.length === 0) {
            toast.error("Vui lòng chọn ít nhất một ngày trong tuần");
            return;
        }

        setIsSavingSchedule(true);

        const onId = `${roomId}-alarm-on`;
        const offId = `${roomId}-alarm-off`;
        const days = selectedDays.map(Number);
        const offTime = addMinutes(alarmOnTime, alarmDurationMinutes);
        const offWindowEnd = addMinutes(offTime, 1);

        const onPayload = {
            id: onId,
            roomId,
            time: alarmOnTime,
            endTime: offTime,
            repeat: true,
            days,
            device: "HUB",
            volume,
            actions: [{ type: "alarm", value: mode, label: "Bật báo thức" }],
        };
        // const offPayload = {
        //     id: offId,
        //     roomId,
        //     time: offTime,
        //     endTime: offWindowEnd,
        //     repeat: true,
        //     days,
        //     device: "HUB",
        //     volume,
        //     actions: [{ type: "alarm", value: "OFF", label: "Tắt báo thức" }],
        // };

        try {
            await send(onPayload, `device/${roomName}/auto/set`);
            // await send(offPayload, `device/${roomName}/auto/set`);

            await configRepo.upsertConfig({
                id: onId,
                name: "Bật báo thức",
                room_id: roomId,
                config_type: "ALARM_ON",
                device_id: hubDeviceId,
                device_type: "HUB",
                power: mode,
                trigger_time: alarmOnTime,
                days_of_week: JSON.stringify(days),
                duration_minutes: alarmDurationMinutes,
                action: JSON.stringify({
                    type: "alarm",
                    value: mode,
                    volume,
                    endTime: offTime,
                    durationMinutes: alarmDurationMinutes,
                }),
                is_active: 1,
            });
            // await configRepo.upsertConfig({
            //     id: offId,
            //     name: "Tắt báo thức",
            //     room_id: roomId,
            //     config_type: "ALARM_OFF",
            //     device_id: hubDeviceId,
            //     device_type: "HUB",
            //     power: "OFF",
            //     trigger_time: offTime,
            //     days_of_week: JSON.stringify(days),
            //     duration_minutes: 1,
            //     action: JSON.stringify({ type: "alarm", value: "OFF", volume, endTime: offWindowEnd }),
            //     is_active: 1,
            // });

            toast.success(`Đã lưu báo thức, tự tắt sau ${alarmDurationMinutes} phút`);
        } catch (error) {
            console.error("Không thể lưu lịch báo thức:", error);
            toast.error("Không thể lưu lịch báo thức xuống Hub");
        } finally {
            setIsSavingSchedule(false);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Âm báo của Hub</CardTitle>
                    <CardDescription>
                        Chọn kiểu chuông và âm lượng báo thức cho khu vực {roomName}.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-6">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="alarm-mode">Kiểu âm báo</FieldLabel>
                            <NativeSelect
                                id="alarm-mode"
                                className="w-full"
                                value={mode}
                                onChange={(event) => setMode(event.target.value as AlarmMode)}
                            >
                                {ALARM_MODES.map((item) => (
                                    <NativeSelectOption key={item.value} value={item.value}>
                                        {item.label}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>

                        <Field>
                            <div className="flex items-center justify-between gap-3">
                                <FieldLabel>Âm lượng</FieldLabel>
                                <span className="text-sm text-muted-foreground">{volume}%</span>
                            </div>
                            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                                <HugeiconsIcon icon={VolumeLowIcon} className="text-muted-foreground" />
                                <Slider
                                    value={volume}
                                    min={0}
                                    max={100}
                                    step={1}
                                    onValueChange={(value) => setVolume(getSliderNumber(value))}
                                />
                                <HugeiconsIcon icon={VolumeHighIcon} className="text-muted-foreground" />
                            </div>
                        </Field>
                    </FieldGroup>
                </CardContent>

                <CardFooter className="flex flex-wrap gap-2">
                    <Button disabled={isSending} onClick={() => sendAlarm(mode)}>
                        <HugeiconsIcon data-icon="inline-start" icon={Notification03Icon} />
                        Phát thử báo thức
                    </Button>
                    <Button variant="outline" disabled={isSending} onClick={() => sendAlarm("OFF")}>
                        <HugeiconsIcon data-icon="inline-start" icon={Cancel01Icon} />
                        Tắt báo thức
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Thời gian báo thức</CardTitle>
                    <CardDescription>
                        Chọn giờ kích hoạt và thời lượng phát báo thức. Hub sẽ tự tắt lúc {alarmEndTime}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="alarm-on-time">Giờ kích hoạt báo thức</FieldLabel>
                            <Input
                                id="alarm-on-time"
                                type="time"
                                value={alarmOnTime}
                                onChange={(event) => setAlarmOnTime(event.target.value)}
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Tự tắt sau</FieldLabel>
                            <ToggleGroup
                                variant="outline"
                                size="lg"
                                value={[String(alarmDurationMinutes)]}
                                onValueChange={(value) => {
                                    const nextValue = value.at(-1);
                                    if (nextValue) setAlarmDurationMinutes(Number(nextValue));
                                }}
                                className="w-full"
                                aria-label="Chọn thời lượng phát báo thức"
                            >
                                {ALARM_DURATIONS.map((duration) => (
                                    <ToggleGroupItem
                                        key={duration.value}
                                        value={duration.value}
                                        aria-label={duration.label}
                                        className="flex-1"
                                    >
                                        {duration.label}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </Field>
                        <Field>
                            <FieldLabel>Ngày lặp lại</FieldLabel>
                            <ToggleGroup
                                multiple
                                variant="outline"
                                size="lg"
                                value={selectedDays}
                                onValueChange={setSelectedDays}
                                className="w-full justify-between"
                                aria-label="Chọn ngày lặp lại báo thức"
                            >
                                {WEEKDAYS.map((day) => (
                                    <ToggleGroupItem
                                        key={day.value}
                                        value={day.value}
                                        aria-label={day.label}
                                        className="flex-1"
                                    >
                                        {day.label}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </Field>
                    </FieldGroup>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" disabled={isSavingSchedule} onClick={saveAlarmSchedule}>
                        Lưu thời gian báo thức
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
