"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { HugeiconsIcon } from "@hugeicons/react";
import {
    PlayIcon,
    StopIcon,
    RefreshIcon,
    Delete02Icon,
} from "@hugeicons/core-free-icons";

type Range = {
    id: string;
    start: number;
    end: number;
};

type Unit = "min" | "sec";

const formatTime = (v: number, unit: Unit) => {
    if (unit === "sec") return `${v}s`;
    const m = Math.floor(v / 60);
    const s = v % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function SchedulerHuge() {
    const BASE_MAX = 60;

    const [unit, setUnit] = useState<Unit>("min");
    const [maxTimeline, setMaxTimeline] = useState<number>(BASE_MAX);
    const [ranges, setRanges] = useState<Range[]>([
        { id: "1", start: 10, end: 25 },
    ]);

    const [running, setRunning] = useState(false);
    const [loop, setLoop] = useState(false);
    const [customValue, setCustomValue] = useState("");

    // ===== TOTAL =====
    const total = useMemo(() => {
        return ranges.reduce((s, r) => {
            const start = Math.min(r.start, maxTimeline);
            const end = Math.min(r.end, maxTimeline);
            return s + Math.max(0, end - start);
        }, 0);
    }, [ranges, maxTimeline]);

    // ===== QUICK SET =====
    const applyQuick = (value: number) => {
        const safe = Math.min(value, BASE_MAX);

        setMaxTimeline(safe);

        setRanges((prev) =>
            prev.map((r) => ({
                ...r,
                start: Math.min(r.start, safe),
                end: Math.min(r.end, safe),
            }))
        );
    };

    const applyCustom = () => {
        const v = Number(customValue);
        if (!v || v <= 0) return;

        const safe = Math.min(v, BASE_MAX);

        setMaxTimeline(safe);

        setRanges((prev) =>
            prev.map((r) => ({
                ...r,
                start: Math.min(r.start, safe),
                end: Math.min(r.end, safe),
            }))
        );
    };

    // ===== ADD RANGE =====
    const addRange = () => {
        setRanges((p) => {
            const lastEnd = p.length ? Math.max(...p.map(r => r.end)) : 0;

            const start = Math.min(lastEnd, maxTimeline);
            const end = Math.min(start + 10, maxTimeline);

            return [
                ...p,
                { id: Date.now().toString(), start, end },
            ];
        });
    };

    const updateRange = (id: string, v: number[]) => {
        setRanges((p) =>
            p.map((r) =>
                r.id === id
                    ? {
                        ...r,
                        start: Math.min(v[0], maxTimeline),
                        end: Math.min(v[1], maxTimeline),
                    }
                    : r
            )
        );
    };

    const remove = (id: string) => {
        setRanges((p) => p.filter((r) => r.id !== id));
    };

    // ===== PAYLOAD =====
    const toSeconds = (value: number) =>
        unit === "min" ? value * 60 : value;

    const buildPayload = () => {
        const sorted = [...ranges].sort((a, b) => a.start - b.start);

        let cursor = 0;

        return sorted.map((r) => {
            const start = toSeconds(r.start);
            const end = toSeconds(r.end);

            const duration = Math.max(0, end - start);
            const offTime = Math.max(0, start - cursor);

            cursor = start + duration;

            return {
                offTime,
                duration,
            };
        });
    };
    const handleStart = () => {
        const payload = buildPayload();
        setRunning(true);
        console.log("SEND PAYLOAD:", payload);
    };

    return (
        <div className="p-4 mb-10 lg:p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT PANEL */}
            <div className="space-y-4">

                {/* HEADER */}
                <Card>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between">
                            <h1 className="font-semibold">Scheduler Pro</h1>
                            <Badge variant={running ? "default" : "secondary"}>
                                {running ? "RUNNING" : "STOP"}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                            <Button className="col-span-2" onClick={handleStart}>
                                <HugeiconsIcon icon={PlayIcon} size={18} />
                                Start
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setLoop(v => !v)}
                            >
                                <HugeiconsIcon icon={RefreshIcon} size={18} />
                                Loop
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={() => setRunning(false)}
                            >
                                <HugeiconsIcon icon={StopIcon} size={18} />
                                Stop
                            </Button>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            Total: {total}{unit} / Max: {maxTimeline}{unit}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={unit === "min" ? "default" : "outline"}
                                onClick={() => setUnit("min")}
                            >
                                Minutes
                            </Button>

                            <Button
                                size="sm"
                                variant={unit === "sec" ? "default" : "outline"}
                                onClick={() => setUnit("sec")}
                            >
                                Seconds
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* QUICK SET */}
                <Card>
                    <CardContent className="p-4 space-y-3">
                        <div className="text-sm font-medium">
                            Quick set (Max: {maxTimeline}{unit})
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {[5, 10, 20, 30, 60].map((m) => (
                                <Button
                                    key={m}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => applyQuick(m)}
                                >
                                    {m}{unit}
                                </Button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={customValue}
                                onChange={(e) => setCustomValue(e.target.value)}
                                placeholder={`custom ${unit}`}
                            />
                            <Button onClick={applyCustom}>Apply</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* CENTER TIMELINE */}
            <div className="lg:col-span-2 space-y-4">

                <Card>
                    <CardContent className="px-4">
                        <div className="relative h-16 bg-muted rounded-full overflow-visible">

                            {ranges.map((r) => {
                                const start = Math.max(r.start, 0);
                                const end = Math.min(r.end, maxTimeline);

                                if (end <= start) return null;

                                const width = ((end - start) / maxTimeline) * 100;
                                const left = (start / maxTimeline) * 100;
                                const duration = r.end - r.start;

                                const isSmall = width < 8;

                                return (
                                    <div
                                        key={r.id}
                                        className="absolute top-0 h-full"
                                        style={{
                                            left: `${left}%`,
                                            width: `${width}%`,
                                        }}
                                    >
                                        <div className="relative w-full h-full bg-green-500/70 rounded">

                                            {!isSmall ? (
                                                <div className="h-full flex items-center justify-center text-[10px] lg:text-xs text-white">
                                                    {duration}{unit}
                                                </div>
                                            ) : (
                                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-0.5 rounded">
                                                    {duration}{unit}
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                );
                            })}

                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* RIGHT RANGES */}
            <div className="lg:col-span-3 space-y-3">

                {ranges.map((r) => (
                    <Card key={r.id}>
                        <CardContent className="p-4 lg:flex lg:items-center lg:gap-4 space-y-2 lg:space-y-0">

                            <div className="text-sm w-40">
                                {formatTime(r.start, unit)} → {formatTime(r.end, unit)}
                            </div>

                            <div className="flex-1">
                                <Slider
                                    min={0}
                                    max={maxTimeline}
                                    step={1}
                                    value={[r.start, r.end]}
                                    onValueChange={(v: any) => updateRange(r.id, v)}/>
                            </div>

                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => remove(r.id)}>
                                <HugeiconsIcon icon={Delete02Icon} size={18} />
                            </Button>

                        </CardContent>
                    </Card>
                ))}

                <Button className="w-full" onClick={addRange}>
                    + Add range
                </Button>
            </div>

        </div>
    );
}