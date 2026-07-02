"use client";

import { useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronDown, ChevronUp, PowerIcon } from "@hugeicons/core-free-icons";
import { Device } from "../Room/DeviceCard";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import { deviceRepo } from "@/db/repository/DeviceRepository";
import { startACTour } from "@/components/onboarding/tours/devicecontrolTour";
import HelpButton from "@/components/common/HelpButton";

const MODES = [
    { key: "COOL", label: "Cool" },
    { key: "DRY", label: "Dry" },
    { key: "FAN", label: "Fan" },
] as const;

export default function ACsController({ data, roomName }: { roomName: string, data: Device }) {
    const [power, setPower] = useState(true);
    const [temperature, setTemperature] = useState(24);
    const [fanSpeed, setFanSpeed] = useState(0); // Mặc định về 0 để khớp với firmware mẫu
    const [mode, setMode] = useState<"COOL" | "DRY" | "FAN">("COOL");

    const topic = deviceRepo.getMqttTopic(data.id);
    const { send } = useTransport();

    // Ánh xạ chuỗi Mode sang dạng số nguyên (int) khớp với firmware ESP32 (Cool=1, Dry=2, Fan/Auto=0)
    const getModeNumber = (currentMode: "COOL" | "DRY" | "FAN") => {
        if (currentMode === "COOL") return 1;
        if (currentMode === "DRY") return 2;
        return 0; // FAN / AUTO
    };

    const sendFullState = async (overrideStates?: {
        power?: boolean;
        temperature?: number;
        mode?: "COOL" | "DRY" | "FAN";
        fanSpeed?: number;
    }) => {
        // Sử dụng giá trị mới nhất vừa thay đổi (override) hoặc fallback về state hiện tại
        const nextPower = overrideStates?.power !== undefined ? overrideStates.power : power;
        const nextTemp = overrideStates?.temperature !== undefined ? overrideStates.temperature : temperature;
        const nextMode = overrideStates?.mode !== undefined ? overrideStates.mode : mode;
        const nextFan = overrideStates?.fanSpeed !== undefined ? overrideStates.fanSpeed : fanSpeed;

        const payload = {
            type: data.type,
            deviceName: data.name,
            brand: data.brand || "UNKNOWN",
            action: {
                power: nextPower ? "ON" : "OFF",
                temp: nextTemp,
                mode: getModeNumber(nextMode),
                fan: nextFan
            },
        };

        console.log("Sending Full State Payload:", payload);
        await send(payload, `device/${roomName}/control/set`);
    };

    return (
        <CardContent className="p-4 md:p-6">
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                    {/* HEADER & POWER BUTTON */}
                    <div className="flex items-center justify-between" data-tour="ac-power">
                        <div>
                            <h1 className="text-xl font-semibold">{data.name}</h1>
                            <p className="text-sm text-muted-foreground">Điều hoà</p>
                        </div>

                        <Button
                            size="icon"
                            className={cn(
                                "rounded-2xl size-14",
                                power ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                            )}
                            onClick={async () => {
                                const next = !power;
                                setPower(next);
                                // Truyền trạng thái power mới trực tiếp để tránh độ trễ bất đồng bộ của useState
                                await sendFullState({ power: next });
                            }}
                        >
                            <HugeiconsIcon icon={PowerIcon} size={26} />
                        </Button>
                    </div>

                    {/* TEMPERATURE CONTROLLER */}
                    <div className="rounded-3xl border bg-muted/30 p-6" data-tour="ac-temp">
                        <div className="flex items-center justify-between">
                            <Button
                                size="icon"
                                variant="outline"
                                className="rounded-2xl size-14"
                                onClick={async () => {
                                    if (temperature <= 16) return;
                                    const next = temperature - 1;
                                    setTemperature(next);
                                    await sendFullState({ temperature: next });
                                }}
                            >
                                <HugeiconsIcon icon={ChevronDown} />
                            </Button>

                            <div className="text-center">
                                <div className="text-6xl lg:text-7xl font-bold">{temperature}°</div>
                                <div className="text-sm text-muted-foreground">Temperature</div>
                            </div>

                            <Button
                                size="icon"
                                variant="outline"
                                className="rounded-2xl size-14"
                                onClick={async () => {
                                    if (temperature >= 30) return;
                                    const next = temperature + 1;
                                    setTemperature(next);
                                    await sendFullState({ temperature: next });
                                }}
                            >
                                <HugeiconsIcon icon={ChevronUp} />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* WORK MODES */}
                    <div className="space-y-3" data-tour="ac-mode">
                        <div className="text-sm font-medium">Mode</div>
                        <div className="grid grid-cols-3 gap-3">
                            {MODES.map((item) => {
                                const active = mode === item.key;
                                return (
                                    <button
                                        key={item.key}
                                        onClick={async () => {
                                            setMode(item.key);
                                            await sendFullState({ mode: item.key });
                                        }}
                                        className={cn(
                                            "rounded-2xl border h-24 flex items-center justify-center text-sm font-medium transition",
                                            active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* FAN SPEED LEVEL */}
                    <div className="space-y-3" data-tour="ac-fan">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Fan Speed</span>
                            <span className="text-xs text-muted-foreground">Level {fanSpeed}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {[0, 1, 2, 3].map((level) => (
                                <button
                                    key={level}
                                    onClick={async () => {
                                        setFanSpeed(level);
                                        await sendFullState({ fanSpeed: level });
                                    }}
                                    className={cn(
                                        "h-14 rounded-2xl border text-sm font-medium transition",
                                        fanSpeed === level ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                                    )}
                                >
                                    {level === 0 ? "Auto" : level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* QUICK INTERACTIONS */}
                    <div className="grid grid-cols-2 gap-3" data-tour="ac-quick">
                        <Button
                            variant="outline"
                            className="h-14 rounded-2xl"
                            onClick={async () => {
                                // Gửi lệnh kèm trigger phụ nếu cần thiết, hoặc giữ nguyên full state cũ
                                await sendFullState();
                                console.log("Triggered Swing command with current state context");
                            }}
                        >
                            Swing
                        </Button>

                        <Button
                            variant="outline"
                            className="h-14 rounded-2xl"
                            onClick={async () => {
                                await sendFullState();
                            }}
                        >
                            Timer
                        </Button>
                    </div>
                </div>
            </div>
        </CardContent>
    );
}
