"use client";

import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { HomeIcon, AddCircleIcon, DeviceAccessIcon, Clock01Icon, SmartPhone01Icon, PlayIcon, Delete02Icon, IcoIcon, } from "@hugeicons/core-free-icons";
import { useMemo, useRef, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, } from "@/components/ui/drawer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type NavItem = {
    label: string;
    icon: any;
    key: string;
};

const navItems: NavItem[] = [
    {
        key: "controll",
        label: "Feature",
        icon: HomeIcon,
    },
    {
        key: "smart",
        label: "Kịch bản",
        icon: DeviceAccessIcon,
    },
    {
        key: "timer",
        label: "Hẹn giờ",
        icon: AddCircleIcon,
    },
];

export default function BottomNavBar({ deviceId, }: { deviceId: any; }) {
    const [active, setActive] = useState<string>("controll");

    const handleOpen = (key: string) => {
        setActive(key);
    };

    const handleClose = () => {
        setActive("controll");
    };

    return (
        <>
            {/* NAVBAR */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md">
                <div className="mx-auto grid max-w-md grid-cols-3 items-center px-2 py-2">
                    {navItems.map((item) => {
                        const isActive =
                            active === item.key;

                        return (
                            <Button
                                key={item.key}
                                variant="ghost"
                                onClick={() =>
                                    handleOpen(item.key)
                                }
                                className={cn(
                                    "flex h-auto w-full flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all duration-200",
                                    isActive &&
                                    "bg-primary/10"
                                )}
                            >
                                <HugeiconsIcon
                                    icon={item.icon}
                                    size={22}
                                    className={cn(
                                        "transition-colors",
                                        isActive
                                            ? "text-primary"
                                            : "text-muted-foreground"
                                    )}
                                />

                                <span
                                    className={cn(
                                        "text-[11px] leading-none transition-colors",
                                        isActive
                                            ? "font-medium text-primary"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* DRAWER */}
            <BottomDrawer
                type={active}
                onClose={handleClose}
            />
        </>
    );
}

function BottomDrawer({ type, onClose, }: { type: string | null; onClose: () => void; }) {
    return (
        <Drawer
            open={
                type !== null &&
                type !== "controll"
            }
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DrawerContent className="mx-auto rounded-2xl bg-white mt-40 w-full">
                <DrawerHeader>
                    <DrawerTitle>
                        {type === "smart" && "Kịch bản thông minh"}

                        {type === "timer" && "Hẹn giờ"}
                    </DrawerTitle>

                    <DrawerDescription>
                        {type === "smart" && "Automation / scenes"}

                        {type === "timer" && "Cài đặt hẹn giờ"}
                    </DrawerDescription>
                </DrawerHeader>

                <div className=" pt-2 overflow-auto px-4 pb-6 h-[70vh]">
                    {type === "smart" && (
                        <SmartSceneUI />
                    )}

                    {type === "timer" && (
                        <TimerUI />
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function SmartSceneUI() {
    return (
        <div className="space-y-3">
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium">
                            Bật đèn ban đêm
                        </div>

                        <div className="text-sm text-muted-foreground">
                            18:00 → 23:00
                        </div>
                    </div>

                    <Switch defaultChecked />
                </div>

                <div className="mt-3 flex gap-2">
                    <Badge>
                        <HugeiconsIcon icon={SmartPhone01Icon} size={14} />
                        Auto
                    </Badge>

                    <Badge variant="outline">
                        Living Room
                    </Badge>
                </div>
            </Card>

            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium">
                            Tắt toàn bộ thiết bị
                        </div>

                        <div className="text-sm text-muted-foreground">
                            Khi rời khỏi nhà
                        </div>
                    </div>

                    <Switch />
                </div>

                <div className="mt-3 flex gap-2">
                    <Badge variant="secondary">
                        Scene
                    </Badge>
                </div>
            </Card>

            <Button className="w-full gap-2">
                <HugeiconsIcon icon={AddCircleIcon} />
                Thêm kịch bản
            </Button>
        </div>
    );
}

type DeviceType =
    | "light"
    | "ac"
    | "tv";

interface Device {
    id: string;
    name: string;
    type: DeviceType;
}

interface TimerData {
    id: string;

    name: string;

    time: string;

    repeat: boolean;

    enabled: boolean;

    deviceId: string;

    action: "ON" | "OFF";
}

export function TimerUI() {
    const [showCreate, setShowCreate] =
        useState(false);

    const [selectedTimerId, setSelectedTimerId] =
        useState<string | null>(null);

    const pressTimer = useRef<any>(null);

    const devices: Device[] = [
        {
            id: "light_1",
            name: "Đèn phòng ngủ",
            type: "light",
        },
        {
            id: "ac_1",
            name: "Máy lạnh phòng khách",
            type: "ac",
        },
        {
            id: "tv_1",
            name: "TV Samsung",
            type: "tv",
        },
    ];

    const [timers, setTimers] = useState<
        TimerData[]
    >([
        {
            id: "1",
            name: "Tắt đèn ngủ",
            time: "22:00",
            repeat: true,
            enabled: true,
            deviceId: "light_1",
            action: "OFF",
        },
        {
            id: "2",
            name: "Bật máy lạnh",
            time: "18:30",
            repeat: true,
            enabled: true,
            deviceId: "ac_1",
            action: "ON",
        },
    ]);

    const [form, setForm] = useState({
        name: "",
        time: "22:00",
        repeat: true,
        enabled: true,
        deviceId: "",
        action: "OFF" as "ON" | "OFF",
    });

    const getDeviceIcon = (
        type: DeviceType
    ) => {
        // switch (type) {
        //     case "light":
        //         return Lightbulb04Icon;

        //     case "ac":
        //         return AirConditionerIcon;

        //     case "tv":
        //         return Tv01Icon;
        // }
        return IcoIcon;
    };

    const createTimer = () => {
        if (!form.deviceId) return;

        const payload: TimerData = {
            id: crypto.randomUUID(),
            ...form,
        };

        setTimers((prev) => [
            payload,
            ...prev,
        ]);

        console.log(
            "Timer Output:",
            JSON.stringify(payload, null, 2)
        );

        setShowCreate(false);

        setForm({
            name: "",
            time: "22:00",
            repeat: true,
            enabled: true,
            deviceId: "",
            action: "OFF",
        });
    };

    const handleLongPress = (
        timerId: string
    ) => {
        pressTimer.current = setTimeout(() => {
            setSelectedTimerId(timerId);
        }, 500);
    };

    const cancelLongPress = () => {
        clearTimeout(pressTimer.current);
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-lg font-semibold">
                        Hẹn giờ thiết bị
                    </div>

                    <div className="text-sm text-muted-foreground">
                        Danh sách timer đang hoạt động
                    </div>
                </div>

                <Button
                    className="gap-2 rounded-2xl"
                    onClick={() =>
                        setShowCreate(!showCreate)}>
                    <HugeiconsIcon icon={PlayIcon} size={18} />
                    Tạo timer
                </Button>
            </div>

            {/* Timer List */}
            <div className="space-y-2">
                {timers.map((timer) => {
                    const device =
                        devices.find(
                            (d) =>
                                d.id ===
                                timer.deviceId
                        );

                    if (!device) return null;

                    const showDelete =
                        selectedTimerId ===
                        timer.id;

                    return (
                        <div
                            key={timer.id}
                            onContextMenu={(
                                e
                            ) => {
                                e.preventDefault();

                                setSelectedTimerId(
                                    timer.id
                                );
                            }}
                            onTouchStart={() =>
                                handleLongPress(
                                    timer.id
                                )
                            }
                            onTouchEnd={
                                cancelLongPress
                            }
                            onMouseDown={() =>
                                handleLongPress(
                                    timer.id
                                )
                            }
                            onMouseUp={
                                cancelLongPress
                            }
                            onMouseLeave={
                                cancelLongPress
                            }
                        >
                            <Card className="rounded-3xl p-4 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
                                            <HugeiconsIcon
                                                icon={getDeviceIcon(
                                                    device.type
                                                )}
                                                size={
                                                    22
                                                }
                                            />
                                        </div>

                                        <div>
                                            <div className="font-medium">
                                                {
                                                    timer.name
                                                }
                                            </div>

                                            <div className="text-sm text-muted-foreground">
                                                {
                                                    device.name
                                                }
                                            </div>

                                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                <HugeiconsIcon
                                                    icon={
                                                        Clock01Icon
                                                    }
                                                    size={
                                                        14
                                                    }
                                                />

                                                {
                                                    timer.time
                                                }

                                                •

                                                {
                                                    timer.action
                                                }

                                                •

                                                {timer.repeat
                                                    ? "Lặp lại"
                                                    : "Một lần"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Delete */}
                                        {showDelete && (
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="rounded-xl"
                                                onClick={() => {
                                                    setTimers(
                                                        (
                                                            prev
                                                        ) =>
                                                            prev.filter(
                                                                (
                                                                    t
                                                                ) =>
                                                                    t.id !==
                                                                    timer.id
                                                            )
                                                    );

                                                    setSelectedTimerId(
                                                        null
                                                    );
                                                }}
                                            >
                                                <HugeiconsIcon
                                                    icon={
                                                        Delete02Icon
                                                    }
                                                    size={
                                                        18
                                                    }
                                                />
                                            </Button>
                                        )}

                                        {/* Enable */}
                                        <Switch
                                            checked={
                                                timer.enabled
                                            }
                                            onCheckedChange={(
                                                checked
                                            ) =>
                                                setTimers(
                                                    (
                                                        prev
                                                    ) =>
                                                        prev.map(
                                                            (
                                                                t
                                                            ) =>
                                                                t.id ===
                                                                    timer.id
                                                                    ? {
                                                                        ...t,
                                                                        enabled:
                                                                            checked,
                                                                    }
                                                                    : t
                                                        )
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </div>

            {/* Create Timer */}
            {showCreate && (
                <Card className="space-y-4 rounded-3xl p-4">
                    <div className="text-base font-semibold">
                        Tạo timer mới
                    </div>

                    {/* Name */}
                    <div>
                        <div className="mb-2 text-sm font-medium">
                            Tên hẹn giờ
                        </div>

                        <Input
                            placeholder="Ví dụ: Tắt TV"
                            value={form.name}
                            onChange={(e) =>
                                setForm(
                                    (
                                        prev
                                    ) => ({
                                        ...prev,
                                        name: e
                                            .target
                                            .value,
                                    })
                                )
                            }
                        />
                    </div>

                    {/* Device */}
                    <div>
                        <div className="mb-2 text-sm font-medium">
                            Chọn thiết bị
                        </div>

                        <div className="grid gap-2">
                            {devices.map(
                                (device) => {
                                    const active =
                                        form.deviceId ===
                                        device.id;

                                    return (
                                        <button
                                            key={
                                                device.id
                                            }
                                            onClick={() =>
                                                setForm(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        deviceId:
                                                            device.id,
                                                    })
                                                )
                                            }
                                            className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${active
                                                ? "border-primary bg-primary/10"
                                                : ""
                                                }`}
                                        >
                                            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                                                <HugeiconsIcon
                                                    icon={getDeviceIcon(
                                                        device.type
                                                    )}
                                                    size={
                                                        20
                                                    }
                                                />
                                            </div>

                                            <div className="text-left">
                                                <div className="font-medium">
                                                    {
                                                        device.name
                                                    }
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    {
                                                        device.type
                                                    }
                                                </div>
                                            </div>
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    {/* Time */}
                    <div>
                        <div className="mb-2 text-sm font-medium">
                            Thời gian
                        </div>

                        <Input
                            type="time"
                            value={form.time}
                            onChange={(e) =>
                                setForm(
                                    (
                                        prev
                                    ) => ({
                                        ...prev,
                                        time: e
                                            .target
                                            .value,
                                    })
                                )
                            }
                        />
                    </div>

                    {/* Action */}
                    <div>
                        <div className="mb-2 text-sm font-medium">
                            Hành động
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={
                                    form.action ===
                                        "ON"
                                        ? "default"
                                        : "outline"
                                }
                                className="flex-1 rounded-2xl"
                                onClick={() =>
                                    setForm(
                                        (
                                            prev
                                        ) => ({
                                            ...prev,
                                            action:
                                                "ON",
                                        })
                                    )
                                }
                            >
                                Bật
                            </Button>

                            <Button
                                type="button"
                                variant={
                                    form.action ===
                                        "OFF"
                                        ? "default"
                                        : "outline"
                                }
                                className="flex-1 rounded-2xl"
                                onClick={() =>
                                    setForm(
                                        (
                                            prev
                                        ) => ({
                                            ...prev,
                                            action:
                                                "OFF",
                                        })
                                    )
                                }
                            >
                                Tắt
                            </Button>
                        </div>
                    </div>

                    {/* Repeat */}
                    <div className="flex items-center justify-between rounded-2xl border p-3">
                        <div>
                            <div className="font-medium">
                                Lặp lại
                            </div>

                            <div className="text-xs text-muted-foreground">
                                Chạy mỗi ngày
                            </div>
                        </div>

                        <Switch
                            checked={
                                form.repeat
                            }
                            onCheckedChange={(
                                value
                            ) =>
                                setForm(
                                    (
                                        prev
                                    ) => ({
                                        ...prev,
                                        repeat:
                                            value,
                                    })
                                )
                            }
                        />
                    </div>

                    {/* Save */}
                    <Button
                        className="w-full gap-2 rounded-2xl"
                        onClick={createTimer}
                    >
                        <HugeiconsIcon
                            icon={PlayIcon}
                            size={18}
                        />

                        Lưu timer
                    </Button>

                    {/* Output */}
                    <div>
                        <div className="mb-2 text-sm font-medium">
                            Output JSON
                        </div>

                        <pre className="overflow-auto rounded-2xl bg-muted p-3 text-xs">
                            {JSON.stringify(
                                {
                                    name: form.name,
                                    deviceId:
                                        form.deviceId,
                                    action:
                                        form.action,
                                    time: form.time,
                                    repeat:
                                        form.repeat,
                                    enabled:
                                        form.enabled,
                                },
                                null,
                                2
                            )}
                        </pre>
                    </div>
                </Card>
            )}
        </div>
    );
}
