"use client";

import { useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { PowerIcon, LightbulbOffIcon } from "@hugeicons/core-free-icons";
import { Device } from "../Room/DeviceCard";
import { Slider } from "@/components/ui/slider";
import { useTransport } from "@/components/providers/transport/TransportProvider";

const COLORS = [
    { key: "WARM", label: "Vàng ấm", colorClass: "bg-yellow-100 text-yellow-700 border-yellow-300" },
    { key: "NEUTRAL", label: "Trung tính", colorClass: "bg-orange-50 text-orange-700 border-orange-200" },
    { key: "COOL", label: "Trắng sáng", colorClass: "bg-blue-50 text-blue-700 border-blue-200" },
] as const;

export default function LightsController({ data }: { data: Device }) {
    const [power, setPower] = useState(true);
    const [brightness, setBrightness] = useState<number[]>([80]);
    const [color, setColor] = useState<"WARM" | "NEUTRAL" | "COOL">("WARM");

    const { send } = useTransport();

    const sendCommand = async (action: Record<string, any>) => {
        const payload = {
            type: data.type, 
            brand: data.brand || "UNKNOWN", 
            action: action, 
        };
        console.log("Sending payload:", payload);
    };

    return (
        <CardContent className="p-4 md:p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">{data?.name || "Smart Light"}</h1>
                    <p className="text-sm text-muted-foreground">Smart Lighting</p>
                </div>

                <Button
                    size="icon"
                    className={cn(
                        "rounded-2xl size-14 transition-all text-white",
                        power ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20" : "bg-red-600 hover:bg-red-700"
                    )}
                    onClick={() => {
                        const next = !power;
                        setPower(next);
                        // Output IN HOA
                        sendCommand({ POWER: next ? "ON" : "OFF" });
                    }}
                >
                    <HugeiconsIcon icon={PowerIcon} size={26} />
                </Button>
            </div>

            <div className="space-y-4 rounded-3xl border bg-muted/30 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={LightbulbOffIcon} className="text-muted-foreground" />
                        <span className="text-sm font-medium">Độ sáng</span>
                    </div>
                    {/* Luôn đảm bảo render ra số nguyên để không bị lỗi UI */}
                    <span className="text-sm font-bold">{brightness[0] || 0}%</span>
                </div>
                <Slider
                    defaultValue={[80]}
                    max={100}
                    min={1}
                    step={1}
                    value={brightness}
                    // Fix lỗi undefined bằng cách bắt cả 2 trường hợp mảng và số
                    onValueChange={(val: any) => {
                        const valNum = Array.isArray(val) ? val[0] : val;
                        setBrightness([valNum]);
                        // Output IN HOA
                        sendCommand({ BRIGHTNESS: valNum });
                    }}
                    className="py-2"
                />
            </div>

            <div className="space-y-3">
                <div className="text-sm font-medium">Nhiệt độ màu</div>
                <div className="grid grid-cols-3 gap-3">
                    {COLORS.map((item) => {
                        const active = color === item.key;
                        return (
                            <button
                                key={item.key}
                                onClick={() => {
                                    setColor(item.key);
                                    // Output IN HOA
                                    sendCommand({ COLOR_TEMP: item.key.toUpperCase() });
                                }}
                                className={cn(
                                    "rounded-2xl border h-16 flex items-center justify-center text-sm font-medium transition",
                                    active ? item.colorClass : "hover:bg-muted bg-transparent border-border"
                                )}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </CardContent>
    );
}