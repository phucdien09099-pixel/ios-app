"use client";

import { useCallback, useEffect, useState } from "react";
import {
    AddCircleIcon,
    Cancel01Icon,
    Delete02Icon,
    Notification03Icon,
    VolumeHighIcon,
    VolumeLowIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
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
import { ConfigDB } from "@/db/types/config";
import { sendNotificationToMe } from "@/libs/fcmClient";

type AlarmMode =
    | "SHORT_BEEP"
    | "LONG_BEEP"
    | "SLOW"
    | "FAST"
    | "SIREN"
    | "AMBULANCE"
    | "WAKEUP";

type AlarmAction = {
    type?: "alarm";
    value?: AlarmMode;
    volume?: number;
    endTime?: string;
    durationMinutes?: number;
    notification?: {
        title: string;
        body: string;
        data: Record<string, string>;
    };
};

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
const WEEKDAY_LABELS = new Map(WEEKDAYS.map((day) => [Number(day.value), day.label]));

const getSliderNumber = (value: number | readonly number[]) =>
    Array.isArray(value) ? value[0] ?? 0 : value;

const addMinutes = (time: string, minutes: number) => {
    const [hour, minute] = time.split(":").map(Number);
    const totalMinutes = (hour * 60 + minute + minutes) % (24 * 60);

    return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
};

const formatAlarmDays = (daysRaw: string) => {
    try {
        const days = JSON.parse(daysRaw || "[]") as number[];
        if (!Array.isArray(days) || days.length === 0 || days.length === 7) return "Hàng ngày";
        return days.map((day) => WEEKDAY_LABELS.get(day) ?? String(day)).join(", ");
    } catch {
        return "Hàng ngày";
    }
};

const getAlarmAction = (config: ConfigDB): AlarmAction => {
    try {
        return config.action ? JSON.parse(config.action) as AlarmAction : {};
    } catch {
        return {};
    }
};

async function loadHubAndAlarms(roomId: string) {
    const hubs = await deviceRepo.getByHubDevice(roomId);
    const roomDevices = await deviceRepo.getByRoom(roomId);
    const hub = hubs[0] ?? roomDevices[0] ?? null;
    const targetDeviceId = hub?.id ?? roomId;

    const configs = await configRepo.getByDevice(targetDeviceId);
    const alarms = configs
        .filter((config) => config.config_type === "ALARM_ON")
        .sort((a, b) => a.trigger_time.localeCompare(b.trigger_time));

    return { hubDeviceId: targetDeviceId, alarms };
}

export default function AlarmSettings({ roomId, roomName }: { roomId: string; roomName: string }) {
    const { open } = useNavDrawer();
    const { send } = useTransport();
    const [hubDeviceId, setHubDeviceId] = useState<string | null>(roomId);
    const [savedAlarms, setSavedAlarms] = useState<ConfigDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingAlarmId, setDeletingAlarmId] = useState<string | null>(null);

    const loadSavedAlarms = useCallback(async () => {
        setLoading(true);
        try {
            const result = await loadHubAndAlarms(roomId);
            setHubDeviceId(result.hubDeviceId);
            setSavedAlarms(result.alarms);
            return result;
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        void loadSavedAlarms();
    }, [loadSavedAlarms]);

    const openCreateAlarm = () => {
        open({
            id: `${roomId}-create-alarm`,
            title: "Thêm báo thức",
            direction: "right",
            component: AlarmFormDrawer,
            props: {
                roomId,
                roomName,
                onSaved: loadSavedAlarms,
            },
        });
    };

    const deleteAlarmSchedule = async (alarmId: string) => {
        setDeletingAlarmId(alarmId);
        try {
            await send({ id: alarmId }, `device/${roomName}/auto/delete`);
            await configRepo.deleteConfig(alarmId);
            await loadSavedAlarms();
            toast.success("Đã xoá báo thức");
        } catch (error) {
            console.error("Không thể xoá báo thức:", error);
            toast.error("Không thể xoá báo thức");
        } finally {
            setDeletingAlarmId(null);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <CardTitle>Danh sách báo thức</CardTitle>
                            <CardDescription>
                                Các báo thức đã lưu cho khu vực {roomName}.
                            </CardDescription>
                        </div>
                        <Button className="shrink-0 rounded-2xl" onClick={openCreateAlarm}>
                            <HugeiconsIcon data-icon="inline-start" icon={AddCircleIcon} />
                            Thêm báo thức
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {loading ? (
                        <div className="rounded-2xl border border-dashed bg-muted/40 p-5 text-center text-sm text-muted-foreground">
                            Đang tải danh sách báo thức...
                        </div>
                    ) : !hubDeviceId ? (
                        <div className="rounded-2xl border border-dashed bg-muted/40 p-5 text-center">
                            <p className="text-sm font-medium">Khu vực này chưa có Hub</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Cần có Hub để cài đặt và nhận báo thức.
                            </p>
                        </div>
                    ) : savedAlarms.length === 0 ? (
                        <div className="rounded-2xl border border-dashed bg-muted/40 p-5 text-center">
                            <p className="text-sm font-medium">Chưa có báo thức nào</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Bấm “Thêm báo thức” để tạo báo thức đầu tiên.
                            </p>
                        </div>
                    ) : (
                        savedAlarms.map((alarm) => {
                            const action = getAlarmAction(alarm);
                            const duration = action.durationMinutes ?? alarm.duration_minutes ?? 0;
                            const endTime = action.endTime ?? addMinutes(alarm.trigger_time, duration || 0);
                            const isDeleting = deletingAlarmId === alarm.id;

                            return (
                                <div key={alarm.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-semibold">{alarm.trigger_time}</span>
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                                đến {endTime}
                                            </span>
                                        </div>
                                        <p className="mt-1 truncate text-sm text-muted-foreground">
                                            {formatAlarmDays(alarm.days_of_week)} · {duration} phút · Âm lượng {action.volume ?? 70}%
                                        </p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="shrink-0 rounded-2xl"
                                        disabled={isDeleting}
                                        onClick={() => deleteAlarmSchedule(alarm.id)}
                                        aria-label="Xoá báo thức"
                                    >
                                        <HugeiconsIcon icon={Delete02Icon} />
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function AlarmFormDrawer({
    roomId,
    roomName,
    onSaved,
}: {
    roomId: string;
    roomName: string;
    onSaved?: () => Promise<unknown>;
}) {
    const { back } = useNavDrawer();
    const { send } = useTransport();
    const [mode, setMode] = useState<AlarmMode>("WAKEUP");
    const [volume, setVolume] = useState(70);
    const [isSending, setIsSending] = useState(false);
    const [alarmOnTime, setAlarmOnTime] = useState("07:00");
    const [alarmDurationMinutes, setAlarmDurationMinutes] = useState(5);
    const [hubDeviceId, setHubDeviceId] = useState<string | null>(roomId);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [selectedDays, setSelectedDays] = useState<string[]>([...ALL_WEEKDAYS]);

    const alarmEndTime = addMinutes(alarmOnTime, alarmDurationMinutes);

    useEffect(() => {
        const loadHub = async () => {
            const result = await loadHubAndAlarms(roomId);
            setHubDeviceId(result.hubDeviceId);
        };

        void loadHub();
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

        const onId = `${roomId}-alarm-${crypto.randomUUID()}`;
        const days = selectedDays.map(Number);
        const offTime = addMinutes(alarmOnTime, alarmDurationMinutes);
        const notification = {
            title: `Báo thức ${roomName}`,
            body: `Báo thức lúc ${alarmOnTime}, tự tắt sau ${alarmDurationMinutes} phút.`,
            data: {
                type: "ALARM",
                alarmId: onId,
                roomId,
                roomName,
                triggerTime: alarmOnTime,
                endTime: offTime,
            },
        };

        const onPayload = {
            id: onId,
            deviceName: roomName,
            time: alarmOnTime,
            endTime: offTime,
            repeat: true,
            days,
            actions: [{ type: "alarm", value: mode, label: "Bật báo thức" }],
        };

        const espAutoPayload = {
            id: onPayload.id,
            deviceName: onPayload.deviceName,
            time: onPayload.time,
            endTime: onPayload.endTime,
            repeat: onPayload.repeat,
            days: onPayload.days,
            actions: [{ type: "alarm", value: mode, volume }],
        };

        try {
            await send(espAutoPayload, `device/${roomName}/auto/set`);

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
                    notification,
                } satisfies AlarmAction),
                is_active: 1,
            });

            try {
                const notifyResult = await sendNotificationToMe({
                    title: "Đã tạo báo thức",
                    body: notification.body,
                    data: {
                        ...notification.data,
                        event: "ALARM_CREATED",
                    },
                });

                if (notifyResult.failureCount > 0 || notifyResult.targetCount === 0) {
                    toast.warning("Đã lưu báo thức, nhưng chưa có thiết bị nhận thông báo đẩy");
                }
            } catch (notifyError) {
                console.warn("Không thể gửi thông báo FCM xác nhận báo thức:", notifyError);
                toast.warning("Đã lưu báo thức, nhưng chưa gửi được thông báo đẩy");
            }

            await onSaved?.();
            toast.success(`Đã lưu báo thức, tự tắt sau ${alarmDurationMinutes} phút`);
            back();
        } catch (error) {
            console.error("Không thể lưu lịch báo thức:", error);
            toast.error("Không thể lưu lịch báo thức xuống Hub");
        } finally {
            setIsSavingSchedule(false);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4 pb-24">
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
                        Lưu báo thức
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
