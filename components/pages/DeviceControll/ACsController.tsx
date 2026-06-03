"use client";

import { useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronDown, ChevronUp, PowerIcon } from "@hugeicons/core-free-icons";
import { Device } from "../Room/DeviceCard";
import { useTransport } from "@/components/providers/transport/TransportProvider";

const MODES = [
    {
        key: "COOL",
        label: "Cool",
        // icon: Snowflake,
    },
    {
        key: "DRY",
        label: "Dry",
        // icon: Droplets,
    },
    {
        key: "FAN",
        label: "Fan",
        // icon: Wind,
    },
] as const;

export default function ACsController({ data }: { data: Device }) {
    const [power, setPower] = useState(true);
    const [temperature, setTemperature] = useState(24);
    const [fanSpeed, setFanSpeed] = useState(2);
    const [mode, setMode] = useState<"COOL" | "DRY" | "FAN">("COOL");

    const { send } = useTransport(); // Khởi tạo hook

    const sendCommand = async (action: Record<string, any>) => {
        const payload = {
            type: data.type, 
            brand: data.brand || "UNKNOWN", // Fallback nếu DB chưa có brand
            action: action, // Chỉ chứa 1 hành động duy nhất
        };
        console.log("Sending payload:", payload);
        // await send(payload, "control"); // Mở comment này khi có provider chạy thật
    };

    return (
        // <Card className="">
        <CardContent className="p-4 md:p-6">
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                    {/* HEADER */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold">
                                {data.name}
                            </h1>

                            <p className="text-sm text-muted-foreground">
                                Air Conditioner
                            </p>
                        </div>

                        <Button
                            size="icon"
                            className={cn(
                                "rounded-2xl size-14",
                                power
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                            )}
                            onClick={() => {
                                const next = !power;

                                setPower(next);

                                // Đổi thành "ON" / "OFF" in hoa
                                sendCommand({ power: next ? "ON" : "OFF" });
                            }}
                        >
                            <HugeiconsIcon
                                icon={PowerIcon}
                                size={26}
                            />
                        </Button>
                    </div>
                    {/* TEMP */}
                    <div className="rounded-3xl border bg-muted/30 p-6">

                        <div className="flex items-center justify-between">

                            <Button
                                size="icon"
                                variant="outline"
                                className="rounded-2xl size-14"
                                onClick={() => {
                                    if (temperature <= 16) return;

                                    const next = temperature - 1;

                                    setTemperature(next);

                                    sendCommand({ temperature: next });
                                }}
                            >
                                <HugeiconsIcon icon={ChevronDown} />
                            </Button>

                            <div className="text-center">
                                <div className="text-6xl lg:text-7xl font-bold">
                                    {temperature}°
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    Temperature
                                </div>
                            </div>

                            <Button
                                size="icon"
                                variant="outline"
                                className="rounded-2xl size-14"
                                onClick={() => {
                                    if (temperature >= 30) return;

                                    const next = temperature + 1;

                                    setTemperature(next);

                                    sendCommand({ temperature: next });
                                }}
                            >
                                <HugeiconsIcon icon={ChevronUp} />
                            </Button>

                        </div>

                    </div>
                </div>
                <div className="space-y-6">
                    {/* MODES */}
                    <div className="space-y-3">

                        <div className="text-sm font-medium">
                            Mode
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {MODES.map((item) => {
                                const active = mode === item.key;

                                return (
                                    <button
                                        key={item.key}
                                        onClick={() => {
                                            setMode(item.key);

                                            // Đổi thành toUpperCase() để lấy chữ IN HOA
                                            sendCommand({ mode: item.key.toUpperCase() });
                                        }}
                                        className={cn(
                                            "rounded-2xl border h-24 flex items-center justify-center text-sm font-medium transition",
                                            active
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>

                    </div>

                    {/* FAN */}
                    <div className="space-y-3">

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                                Fan Speed
                            </span>

                            <span className="text-xs text-muted-foreground">
                                Level {fanSpeed}
                            </span>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => {
                                        setFanSpeed(level);

                                        sendCommand({
                                            type: "FAN_SPEED",
                                            value: level,
                                        });
                                    }}
                                    className={cn(
                                        "h-14 rounded-2xl border text-sm font-medium transition",
                                        fanSpeed === level
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>

                    </div>

                    {/* QUICK ACTION */}
                    <div className="grid grid-cols-2 gap-3">

                        <Button
                            variant="outline"
                            className="h-14 rounded-2xl"
                            onClick={() => {
                                sendCommand({
                                    type: "SWING",
                                });
                            }}
                        >
                            Swing
                        </Button>

                        <Button
                            variant="outline"
                            className="h-14 rounded-2xl"
                            onClick={() => {
                                sendCommand({
                                    type: "TIMER",
                                });
                            }}
                        >
                            Timer
                        </Button>

                    </div>

                </div>
            </div>
        </CardContent>
        // </Card>
    );
}