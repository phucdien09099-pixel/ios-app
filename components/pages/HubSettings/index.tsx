"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import { cn } from "@/libs/utils";
import { resumeTourAfterDeviceDrawer, pauseTourForDeviceDrawer } from "@/components/onboarding/tours/afterAddDeviceTour";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ColorsIcon,
    DashboardSpeed01Icon,
    Notification03Icon,
    PaintBoardIcon,
    Sun01Icon,
    Sun03Icon,
    VolumeHighIcon,
    VolumeLowIcon,
} from "@hugeicons/core-free-icons";

import { ColorWheel } from "./ColorWheel";
import { parseColor } from "react-aria-components";

type ColorMode = "LED_STATIC" | "LED_ROTATING" | "LED_BREATHING" | "LED_WAVE" | "LED_RAINBOW";

const STATIC_COLORS = [
    { name: "Red", hex: "ff4b22" },
    { name: "Orange", hex: "ff9f1c" },
    { name: "Yellow", hex: "ffe928" },
    { name: "Green", hex: "32e875" },
    { name: "Cyan", hex: "35c7f3" },
    { name: "Blue", hex: "4f74f9" },
    { name: "Purple", hex: "af52f5" },
] as const;

const SEND_DELAY_MS = 500;
const brightnessToPercent = (value: number) => Math.round(((value - 1) * 99) / 254 + 1);
const speedToPayload = (value: number) => 256 - value;
const toPayloadMode = (value: ColorMode) => value.replace("LED_", "");
const getSliderNumber = (value: number | readonly number[]) => Array.isArray(value) ? value[0] ?? 0 : value;

export default function HubSettings({ roomName }: { roomName: any }) {
    const [currentValue, setCurrentValue] = useState(parseColor("#00ffcc"));
    const [mode, setMode] = useState<ColorMode>("LED_STATIC");
    const [brightness, setBrightness] = useState(191);
    const [speed, setSpeed] = useState(100);
    const [notificationVolume, setNotificationVolume] = useState(70);

    const { send } = useTransport();
    const ledSendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const alarmSendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const colorHex = currentValue.toString("hex").split("#")[1];
    const brightnessValue = brightness;
    const speedValue = speed;
    const brightnessPercent = brightnessToPercent(brightnessValue);
    const payloadSpeed = speedToPayload(speedValue);
    // console.log(roomName)
    useEffect(() => {
        return () => {
            if (ledSendTimerRef.current) clearTimeout(ledSendTimerRef.current);
            if (alarmSendTimerRef.current) clearTimeout(alarmSendTimerRef.current);
        };
    }, []);
    
    useEffect(() => {
        pauseTourForDeviceDrawer();
        return () => {
            resumeTourAfterDeviceDrawer(); 
        };
    }, []);

    const scheduleLedSet = ({
        nextMode = mode,
        nextSpeed = speedToPayload(speedValue),
        nextBrightness = brightnessValue,
        nextColor = `#${colorHex}`,
    }: {
        nextMode?: ColorMode;
        nextSpeed?: number;
        nextBrightness?: number;
        nextColor?: string;
    } = {}) => {
        if (ledSendTimerRef.current) clearTimeout(ledSendTimerRef.current);

        ledSendTimerRef.current = setTimeout(() => {
            send(
                {
                    mode: toPayloadMode(nextMode),
                    speed: nextSpeed,
                    brightness: nextBrightness,
                    color: nextColor,
                },
                `device/${roomName}/led/set`
            );
        }, SEND_DELAY_MS);
    };

    const scheduleAlarmSet = (nextVolume: number) => {
        if (alarmSendTimerRef.current) clearTimeout(alarmSendTimerRef.current);

        alarmSendTimerRef.current = setTimeout(() => {
            send(
                {
                    volume: nextVolume,
                    mode: "OFF",
                },
                `device/${roomName}/alarm/set`
            );
        }, SEND_DELAY_MS);
    };

    const onColorChange = (val: any) => {
        setCurrentValue(val);
        const hex = val.toString("hex").split("#")[1];
        scheduleLedSet({ nextColor: `#${hex}` });
    };

    const onPresetColorChange = (hex: string) => {
        setCurrentValue(parseColor(`#${hex}`));
        setMode("LED_STATIC");
        scheduleLedSet({ nextMode: "LED_STATIC", nextColor: `#${hex}` });
    };

    const onBrightnessChange = (value: number | readonly number[]) => {
        const nextBrightness = getSliderNumber(value);
        setBrightness(nextBrightness);
        scheduleLedSet({ nextBrightness });
    };

    const onSpeedChange = (value: number | readonly number[]) => {
        const nextSpeed = getSliderNumber(value);
        setSpeed(nextSpeed);
        scheduleLedSet({ nextSpeed: speedToPayload(nextSpeed) });
    };

    const onModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value as ColorMode;
        setMode(value);
        scheduleLedSet({ nextMode: value });
    };

    const onNotificationVolumeChange = (value: number | readonly number[]) => {
        const nextVolume = getSliderNumber(value);
        setNotificationVolume(nextVolume);
        scheduleAlarmSet(nextVolume);
    };

    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-semibold">Hub Settings</h1>
                <p className="text-sm text-muted-foreground">Lighting and notification controls</p>
            </div>

            <Tabs defaultValue="lighting" className="flex flex-col gap-4">
                <TabsList className="w-full" data-tour="hub-tabs" >
                    <TabsTrigger value="lighting" className="flex-1" data-tour="hub-tab-light">
                        <HugeiconsIcon icon={ColorsIcon} data-icon="inline-start" />
                        Điều chỉnh đèn
                    </TabsTrigger>
                    <TabsTrigger value="notification-volume" className="flex-1" data-tour="hub-tab-volume">
                        <HugeiconsIcon icon={Notification03Icon} data-icon="inline-start" />
                        Âm lượng thông báo
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="lighting">
                    <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
                        <Card>
                            <CardHeader>
                                <CardTitle>Điều chỉnh đèn</CardTitle>
                                <CardDescription>Chọn màu, độ sáng, tốc độ và hiệu ứng LED</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-6">
                                <div className="flex flex-col items-center gap-4" data-tour="hub-color-wheel">
                                    <div className="flex items-center gap-2">
                                        <HugeiconsIcon icon={ColorsIcon} />
                                        <p className="font-medium">RGB Color</p>
                                    </div>

                                    <ColorWheel value={currentValue} onChange={onColorChange} />
                                </div>

                                <div className="flex flex-col gap-3" data-tour="hub-presets">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium">Static presets</p>
                                        <span className="text-xs text-muted-foreground">
                                            #{colorHex.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-7 gap-2">
                                        {STATIC_COLORS.map((item) => {
                                            const active = colorHex.toLowerCase() === item.hex;

                                            return (
                                                <Button
                                                    key={item.hex}
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    title={item.name}
                                                    aria-label={item.name}
                                                    className={cn(
                                                        "size-10 rounded-full p-0",
                                                        active && "ring-2 ring-ring/40"
                                                    )}
                                                    style={{ backgroundColor: `#${item.hex}` }}
                                                    onClick={() => onPresetColorChange(item.hex)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3" data-tour="hub-brightness">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium">Brightness</p>
                                        <span className="text-xs text-muted-foreground">
                                            {brightnessPercent}% · {brightnessValue}/255
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                                        <HugeiconsIcon icon={Sun01Icon} className="text-muted-foreground" />
                                        <Slider
                                            value={brightness}
                                            min={1}
                                            max={255}
                                            step={1}
                                            onValueChange={onBrightnessChange}
                                        />
                                        <HugeiconsIcon icon={Sun03Icon} className="text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3" data-tour="hub-speed">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium">Speed</p>
                                        <span className="text-xs text-muted-foreground">{payloadSpeed}/255</span>
                                    </div>

                                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                                        <HugeiconsIcon icon={DashboardSpeed01Icon} className="text-muted-foreground" />
                                        <Slider
                                            value={speed}
                                            min={1}
                                            max={255}
                                            step={1}
                                            onValueChange={onSpeedChange}
                                        />
                                        <HugeiconsIcon icon={DashboardSpeed01Icon} className="text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3" data-tour="hub-mode">
                                    <div className="flex items-center gap-2">
                                        <HugeiconsIcon icon={PaintBoardIcon} />
                                        <p className="font-medium">Lighting Mode</p>
                                    </div>

                                    <NativeSelect value={mode} onChange={onModeChange}>
                                        <NativeSelectOption value="LED_STATIC">Static</NativeSelectOption>
                                        <NativeSelectOption value="LED_ROTATING">Rotating</NativeSelectOption>
                                        <NativeSelectOption value="LED_BREATHING">Breathing</NativeSelectOption>
                                        <NativeSelectOption value="LED_WAVE">Wave</NativeSelectOption>
                                        <NativeSelectOption value="LED_RAINBOW">Rainbow</NativeSelectOption>
                                    </NativeSelect>
                                </div>
                            </CardContent>
                        </Card>

                        {/* <Card className="min-h-80 p-0">
                            <CardContent className="relative min-h-80 p-0">
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background:
                                            mode === "LED_RAINBOW"
                                                ? "linear-gradient(135deg, red, orange, yellow, green, cyan, blue, violet)"
                                                : mode === "LED_ROTATING"
                                                    ? `linear-gradient(135deg, #${colorHex}, #000000)`
                                                    : `#${colorHex}`,
                                        filter: `brightness(${brightnessPercent}%)`,
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/30" />
                            </CardContent>
                        </Card> */}
                    </div>
                </TabsContent>

                <TabsContent value="notification-volume">
                    <Card>
                        <CardHeader>
                            <CardTitle>Âm lượng thông báo</CardTitle>
                            <CardDescription>Điều chỉnh mức âm lượng chuông và cảnh báo của hub</CardDescription>
                        </CardHeader>
                        <CardContent className="flex min-h-80 flex-col justify-center gap-8" data-tour="hub-volume-slider">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                                    <HugeiconsIcon icon={Notification03Icon} />
                                </div>
                                <div className="text-5xl font-semibold">{notificationVolume}%</div>
                            </div>

                            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                                <HugeiconsIcon icon={VolumeLowIcon} className="text-muted-foreground" />
                                <Slider
                                    value={notificationVolume}
                                    min={0}
                                    max={100}
                                    step={1}
                                    onValueChange={onNotificationVolumeChange}
                                />
                                <HugeiconsIcon icon={VolumeHighIcon} className="text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
