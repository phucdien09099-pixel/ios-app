"use client";

import { useRef, useState } from "react";

import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import { HugeiconsIcon } from "@hugeicons/react";
import {
    ColorsIcon,
    PaintBoardIcon,
    CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

import { ColorWheel } from "./ColorWheel";
import { parseColor } from "react-aria-components";

import { BluetoothTransport } from "@/core/connection/bluetooth/BluetoothTransport";
import { useTransport } from "@/components/providers/transport/TransportProvider";
// import { transportManager } from "@/core/discovery";

// ================= TYPES =================
type ColorMode = "LED_STATIC" | "LED_ROTATING" | "LED_BREATHING" | "LED_WAVE" | "LED_RAINBOW";

export default function HubSettings() {
    // ================= STATE =================
    const [currentValue, setCurrentValue] = useState(parseColor("#00ffcc"));
    const [mode, setMode] = useState<ColorMode>("LED_STATIC");
    const [loading, setLoading] = useState(false);

    const colorHex = currentValue.toString("hex").split("#")[1];
    const { send } = useTransport();

    // ================= COLOR CHANGE (REALTIME FIX) =================
    const onColorChange = async (val: any) => {
        setCurrentValue(val);
        const hex = val.toString("hex").split("#")[1];
        await send(hex, "led/color");
    };

    const onModeChange = async (e: any) => {
        const value = e.target.value as ColorMode
        setMode(value);
        send(value, "led/mode");
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <div className="grid gap-6 xl:grid-cols-[420px_1fr]">

                <CardContent className="p-6 space-y-6">

                    {/* TITLE */}
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Hub Settings
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            RGB lighting & ambient effects
                        </p>
                    </div>

                    {/* COLOR PICKER */}
                    <div className="space-y-4 flex flex-col items-center">
                        <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={ColorsIcon} size={18} />
                            <p className="font-medium">RGB Color</p>
                        </div>

                        <ColorWheel
                            value={currentValue}
                            onChange={onColorChange}
                        />
                    </div>

                    {/* MODE */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={PaintBoardIcon} size={18} />
                            <p className="font-medium">Lighting Mode</p>
                        </div>

                        <NativeSelect
                            value={mode}
                            onChange={onModeChange}>
                            <NativeSelectOption value="LED_STATIC">
                                Static
                            </NativeSelectOption>
                            <NativeSelectOption value="LED_ROTATING">
                                Rotating
                            </NativeSelectOption>
                            <NativeSelectOption value="LED_BREATHING">
                                Breathing
                            </NativeSelectOption>
                            <NativeSelectOption value="LED_WAVE">
                                Wave
                            </NativeSelectOption>
                            <NativeSelectOption value="LED_RAINBOW">
                                Rainbow
                            </NativeSelectOption>
                        </NativeSelect>
                    </div>
                </CardContent>

                {/* PREVIEW */}
                <CardContent className="relative p-0 h-full">
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                mode === "LED_RAINBOW"
                                    ? "linear-gradient(135deg, red, orange, yellow, green, cyan, blue, violet)"
                                    : mode === "LED_ROTATING"
                                        ? `linear-gradient(135deg, #${colorHex}, #000000)`
                                        : `#${colorHex}`,
                        }}
                    />

                    <div className="absolute inset-0 bg-black/30" />

                    <div className="relative z-10 h-full flex flex-col justify-between p-8 text-white">

                        <div className="text-sm opacity-70">
                            Smart Hub
                        </div>

                        <div className="flex flex-col items-center space-y-6">

                            <div
                                className="w-52 h-52 rounded-full"
                                style={{
                                    background: `#${colorHex}`,
                                    boxShadow: `0 0 80px #${colorHex}`,
                                }}
                            />

                            <div className="text-center">
                                <h2 className="text-4xl font-bold">
                                    {mode}
                                </h2>
                                <p className="font-mono">
                                    #{colorHex}
                                </p>
                            </div>

                        </div>

                        <div className="text-sm opacity-70 flex justify-between">
                            <span>RGB System</span>
                            <span>Connected</span>
                        </div>
                    </div>
                </CardContent>
            </div >
        </div >
    );
}