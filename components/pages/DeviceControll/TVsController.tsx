"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Home, Pause, Play, PowerIcon, Settings, Volume2 } from "@hugeicons/core-free-icons";
import { CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Device } from "../Room/DeviceCard";
import { cn } from "@/libs/utils";
import { useState } from "react";

export default function TVsController({ data }: { data: Device }) {
    const [power, setPower] = useState(true);
    const [volume, setVolume] = useState(15);
    const [channel, setChannel] = useState(5);
    const [playing, setPlaying] = useState(false);

    const sendCommand = (payload: any) => {
        console.log("SEND MQTT / IR", payload);
    };

    return (
        <CardContent className="p-6 space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold">
                        Samsung TV
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Living Room
                    </p>
                </div>

                <Button
                    size="icon"
                    className={cn(
                        "rounded-full size-12",
                        power
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-secondary"
                    )}
                    onClick={() => {
                        const next = !power;

                        setPower(next);

                        sendCommand({
                            type: "POWER",
                            value: next,
                        });
                    }}>

                    <HugeiconsIcon icon={PowerIcon} />

                </Button>
            </div>

            {/* CHANNEL */}
            <div className="flex flex-col items-center justify-center space-y-4">

                <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full size-12"
                    onClick={() => {
                        const next = channel + 1;

                        setChannel(next);

                        sendCommand({
                            type: "CHANNEL_UP",
                            value: next,
                        });
                    }}>


                    <HugeiconsIcon icon={ChevronUp} />
                </Button>

                <div className="text-center">
                    <div className="text-6xl font-bold">
                        {channel}
                    </div>

                    <div className="text-sm text-muted-foreground">
                        Channel
                    </div>
                </div>

                <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full size-12"
                    onClick={() => {
                        if (channel <= 1) return;

                        const next = channel - 1;

                        setChannel(next);

                        sendCommand({
                            type: "CHANNEL_DOWN",
                            value: next,
                        });
                    }}>
                    <HugeiconsIcon icon={ChevronDown} />
                </Button>
            </div>

            {/* VOLUME */}
            <div className="space-y-3">

                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                        Volume
                    </span>

                    <span className="text-sm text-muted-foreground">
                        {volume}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2">

                    <Button
                        variant="outline"
                        onClick={() => {
                            if (volume <= 0) return;

                            const next = volume - 1;

                            setVolume(next);

                            sendCommand({
                                type: "VOLUME_DOWN",
                                value: next,
                            });
                        }}
                    >
                        -
                    </Button>

                    <Button
                        variant="secondary"
                        disabled
                    >
                        <HugeiconsIcon icon={Volume2} />
                        {volume}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => {
                            if (volume >= 100) return;

                            const next = volume + 1;

                            setVolume(next);

                            sendCommand({
                                type: "VOLUME_UP",
                                value: next,
                            });
                        }}
                    >
                        +
                    </Button>

                </div>

            </div>

            {/* NAVIGATION */}
            <div className="flex flex-col items-center gap-2">

                <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full size-12"
                    onClick={() =>
                        sendCommand({
                            type: "UP",
                        })
                    }
                >
                    <HugeiconsIcon icon={ChevronUp} />
                </Button>

                <div className="flex items-center gap-2">

                    <Button
                        size="icon"
                        variant="outline"
                        className="rounded-full size-12"
                        onClick={() =>
                            sendCommand({
                                type: "LEFT",
                            })
                        }>
                        <HugeiconsIcon icon={ChevronLeft} />
                    </Button>

                    <Button
                        size="icon"
                        className="rounded-full size-14"
                        onClick={() =>
                            sendCommand({
                                type: "OK",
                            })
                        }
                    >
                        OK
                    </Button>

                    <Button
                        size="icon"
                        variant="outline"
                        className="rounded-full size-12"
                        onClick={() =>
                            sendCommand({
                                type: "RIGHT",
                            })
                        }>
                        <HugeiconsIcon icon={ChevronRight} />
                    </Button>

                </div>

                <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full size-12"
                    onClick={() =>
                        sendCommand({
                            type: "DOWN",
                        })
                    }
                >
                    <HugeiconsIcon icon={ChevronDown} />
                </Button>

            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-4 gap-3">

                <Button
                    variant="outline"
                    className="h-12 rounded-xl"
                    onClick={() =>
                        sendCommand({
                            type: "HOME",
                        })
                    }>
                    <HugeiconsIcon icon={Home} />
                </Button>

                <Button
                    variant="outline"
                    className="h-12 rounded-xl"
                    onClick={() => {
                        const next = !playing;

                        setPlaying(next);

                        sendCommand({
                            type: next ? "PLAY" : "PAUSE",
                        });
                    }}
                >
                    {playing ? (
                        <HugeiconsIcon icon={Pause} />
                    ) : (
                        <HugeiconsIcon icon={Play} />
                    )}
                </Button>

                <Button
                    variant="outline"
                    className="h-12 rounded-xl"
                    onClick={() =>
                        sendCommand({
                            type: "SETTINGS",
                        })
                    }>
                    <HugeiconsIcon icon={Settings} />
                </Button>

                <Button
                    variant="outline"
                    className="h-12 rounded-xl"
                    onClick={() =>
                        sendCommand({
                            type: "MUTE",
                        })
                    }
                >
                    🔇
                </Button>

            </div>
        </CardContent>
    );
}