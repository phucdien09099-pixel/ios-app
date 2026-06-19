"use client";

// Đã import thêm VolumeOffIcon cho trạng thái Mute
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Home, Pause, Play, PowerIcon, Settings, Volume2, VolumeOffIcon } from "@hugeicons/core-free-icons";
import { CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Device } from "../Room/DeviceCard";
import { cn } from "@/libs/utils";
import { useState } from "react";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import { startTVTour } from "@/components/onboarding/tours/devicecontrolTour";
import HelpButton from "@/components/common/HelpButton";

export default function TVsController({ data }: { data: Device }) {
    const [power, setPower] = useState(true);
    const [volume, setVolume] = useState(15);
    const [channel, setChannel] = useState(5);
    const [playing, setPlaying] = useState(false);
    
    // Thêm state để theo dõi Mute
    const [isMuted, setIsMuted] = useState(false);

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
    <CardContent className="p-6 space-y-6">

        <div className="flex items-center justify-between" data-tour="tv-power">
            <div>
                <h1 className="text-lg font-semibold">Samsung TV</h1>
                <p className="text-sm text-muted-foreground">Living Room</p>
            </div>

            <Button
                size="icon"
                className={cn(
                    "rounded-full size-12 transition-all text-white",
                    power ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20" : "bg-red-600 hover:bg-red-700"
                )}
                onClick={() => {
                    const next = !power;
                    setPower(next);
                    sendCommand({ POWER: next ? "ON" : "OFF" });
                }}>
                <HugeiconsIcon icon={PowerIcon} />
            </Button>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4" data-tour="tv-channel">
            <Button
                size="icon"
                variant="outline"
                className="rounded-full size-12"
                onClick={() => {
                    const next = channel + 1;
                    setChannel(next);
                    sendCommand({ CHANNEL: next });
                }}>
                <HugeiconsIcon icon={ChevronUp} />
            </Button>

            <div className="text-center">
                <div className="text-6xl font-bold">{channel}</div>
                <div className="text-sm text-muted-foreground">Channel</div>
            </div>

            <Button
                size="icon"
                variant="outline"
                className="rounded-full size-12"
                onClick={() => {
                    if (channel <= 1) return;
                    const next = channel - 1;
                    setChannel(next);
                    sendCommand({ CHANNEL: next });
                }}>
                <HugeiconsIcon icon={ChevronDown} />
            </Button>
        </div>

        <div className="space-y-3" data-tour="tv-volume">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Volume</span>
                <span className="text-sm text-muted-foreground">{volume}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <Button
                    variant="outline"
                    onClick={() => {
                        if (volume <= 0) return;
                        const next = volume - 1;
                        setVolume(next);
                        sendCommand({ VOLUME: next });
                    }}
                >
                    -
                </Button>

                <Button variant="secondary" disabled>
                    <HugeiconsIcon icon={Volume2} />
                    {volume}
                </Button>

                <Button
                    variant="outline"
                    onClick={() => {
                        if (volume >= 100) return;
                        const next = volume + 1;
                        setVolume(next);
                        sendCommand({ VOLUME: next });
                    }}
                >
                    +
                </Button>
            </div>
        </div>

        <div className="flex flex-col items-center gap-2" data-tour="tv-navigation">
            <Button
                size="icon"
                variant="outline"
                className="rounded-full size-12"
                onClick={() => sendCommand({ COMMAND: "UP" })}
            >
                <HugeiconsIcon icon={ChevronUp} />
            </Button>

            <div className="flex items-center gap-2">
                <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full size-12"
                    onClick={() => sendCommand({ COMMAND: "LEFT" })}
                >
                    <HugeiconsIcon icon={ChevronLeft} />
                </Button>

                <Button
                    size="icon"
                    className="rounded-full size-14"
                    onClick={() => sendCommand({ COMMAND: "OK" })}
                >
                    OK
                </Button>

                <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full size-12"
                    onClick={() => sendCommand({ COMMAND: "RIGHT" })}
                >
                    <HugeiconsIcon icon={ChevronRight} />
                </Button>
            </div>

            <Button
                size="icon"
                variant="outline"
                className="rounded-full size-12"
                onClick={() => sendCommand({ COMMAND: "DOWN" })}
            >
                <HugeiconsIcon icon={ChevronDown} />
            </Button>
        </div>

        <div className="grid grid-cols-4 gap-3" data-tour="tv-quick">
            <Button
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => sendCommand({ COMMAND: "HOME" })}
            >
                <HugeiconsIcon icon={Home} />
            </Button>

            <Button
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => {
                    const next = !playing;
                    setPlaying(next);
                    sendCommand({ COMMAND: next ? "PLAY" : "PAUSE" });
                }}
            >
                {playing ? <HugeiconsIcon icon={Pause} /> : <HugeiconsIcon icon={Play} />}
            </Button>

            <Button
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => sendCommand({ COMMAND: "SETTINGS" })}
            >
                <HugeiconsIcon icon={Settings} />
            </Button>

            <Button
                variant="outline"
                className={cn(
                    "h-12 rounded-xl transition-all",
                    isMuted ? "bg-red-100 text-red-600 border-red-300 hover:bg-red-200" : ""
                )}
                onClick={() => {
                    const next = !isMuted;
                    setIsMuted(next);
                    sendCommand({ COMMAND: next ? "MUTE" : "UNMUTE" });
                }}
            >
                {isMuted ? <HugeiconsIcon icon={VolumeOffIcon} /> : <HugeiconsIcon icon={Volume2} />}
            </Button>
        </div>
    </CardContent>
);
}