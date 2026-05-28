"use client";
import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Clock01Icon,
    Delete02Icon,
    IcoIcon,
    PlayIcon,
    Cancel01Icon,
    Tick01Icon // import icon check nếu cần
} from "@hugeicons/core-free-icons";
import { useMemo, useRef, useState } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import CreateTimerDrawer from "./CreateTimer";
import { Device } from "@/db/types/devive";
import { FormProvider, useForm } from "react-hook-form";

type DeviceType = "light" | "ac" | "tv" | "switch";

// Định nghĩa lại cấu trúc Action mới
interface TimerAction {
    type: "power" | "temp" | "brightness" | "color" | "volume" | "channel"; // Chức năng
    value: string | number | boolean; // Giá trị cụ thể (ON/OFF, 24, 50, v.v.)
    label: string; // Nhãn hiển thị tiếng Việt
}

export interface TimerFormValues {
    name: string;
    time: string;
    days: DayOfWeek[];
    repeat: boolean;
    enabled: boolean;
    deviceId: string;
    deviceType: DeviceType;
    action: TimerAction;
}
export type DayOfWeek =
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";

export const DAYS_OF_WEEK: DayOfWeek[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

export const DAYS_LABELS: Record<
    DayOfWeek,
    string
> = {
    Monday: "T2",
    Tuesday: "T3",
    Wednesday: "T4",
    Thursday: "T5",
    Friday: "T6",
    Saturday: "T7",
    Sunday: "CN",
};

const DEVICE_ACTIONS: Record<DeviceType, TimerAction[]> = {
    light: [
        { type: "power", value: "ON", label: "Bật đèn" },
        { type: "power", value: "OFF", label: "Tắt đèn" },
        { type: "brightness", value: 50, label: "Điều chỉnh độ sáng 50%" },
        { type: "color", value: "#FFFFFF", label: "Đổi màu đèn (Trắng)" },
    ],
    ac: [
        { type: "power", value: "ON", label: "Bật máy lạnh" },
        { type: "power", value: "OFF", label: "Tắt máy lạnh" },
        { type: "temp", value: "UP", label: "Tăng nhiệt độ" },
        { type: "temp", value: "DOWN", label: "Giảm nhiệt độ" },
        { type: "temp", value: 24, label: "Đặt nhiệt độ 24°C" },
    ],
    tv: [
        { type: "power", value: "ON", label: "Bật TV" },
        { type: "power", value: "OFF", label: "Tắt TV" },
        { type: "volume", value: "UP", label: "Tăng âm lượng" },
        { type: "volume", value: "DOWN", label: "Giảm âm lượng" },
        { type: "channel", value: 1, label: "Chuyển sang Kênh 1" },
    ],
    switch: [
        { type: "power", value: "ON", label: "Bật công tắc" },
        { type: "power", value: "OFF", label: "Tắt công tắc" },
    ],
};

export function TimerUI() {
    const [selectedTimerId, setSelectedTimerId] = useState<string | null>(null);
    const pressTimer = useRef<any>(null);
    const { open, back } = useNavDrawer(); // Lấy thêm hàm close để đóng drawer khi cần

    const devices: Device[] = [
        { room_id: "1", id: "light_1", name: "Đèn phòng ngủ", type: "light" },
        { room_id: "2", id: "ac_1", name: "Máy lạnh phòng khách", type: "ac" },
        { room_id: "3", id: "tv_1", name: "TV Samsung", type: "tv" },
        { room_id: "4", id: "switch_1", name: "Công tắc chính", type: "switch" },
    ];

    const [timers, setTimers] = useState<any[]>([
        {
            id: "1",
            name: "Tắt đèn ngủ",
            time: "22:00",
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            repeat: true,
            enabled: true,
            deviceId: "light_1",
            deviceType: "" as DeviceType,
            action: { type: "power", value: "ON", label: "Bật" },
        },
    ]);

    const getDeviceIcon = (type: DeviceType) => {
        return IcoIcon;
    };

    const handleLongPress = (timerId: string) => {
        pressTimer.current = setTimeout(() => {
            setSelectedTimerId(timerId);
        }, 500);
    };

    const cancelLongPress = () => {
        clearTimeout(pressTimer.current);
    };


    return (
        <div className="space-y-3 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-lg font-semibold">Hẹn giờ thiết bị</div>
                    <div className="text-sm text-muted-foreground">Danh sách timer đang hoạt động</div>
                </div>
                <Button
                    onClick={() =>
                        open({
                            id: "createTimer",
                            title: "Tạo timer",
                            direction: 'right',
                            className: 'mt-40',
                            component: CreateTimerDrawer,
                            props: {
                                devices,
                                onCreateTimer: (data: any) => {
                                    console.log(data)
                                    setTimers((prev) => [
                                        {
                                            id: crypto.randomUUID(),
                                            ...data,
                                        },
                                        ...prev,
                                    ]);
                                },
                                getDeviceIcon,
                            },
                        })}>
                    Tạo timer
                </Button>
            </div>

            {/* Timer List */}
            <div className="space-y-2">
                {timers.map((timer) => {
                    const device = devices.find((d) => d.id === timer.deviceId);
                    if (!device) return null;

                    const showDelete = selectedTimerId === timer.id;
                    const daysDisplay = timer.days.length === 7 ? "Hàng ngày" : timer.days.map((d: DayOfWeek) => DAYS_LABELS[d]).join(", ");

                    return (
                        <div
                            key={timer.id}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setSelectedTimerId(timer.id);
                            }}
                            onTouchStart={() => handleLongPress(timer.id)}
                            onTouchEnd={cancelLongPress}
                            onMouseDown={() => handleLongPress(timer.id)}
                            onMouseUp={cancelLongPress}
                            onMouseLeave={cancelLongPress}>
                            <Card className="rounded-3xl p-4 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
                                            <HugeiconsIcon icon={getDeviceIcon(device.type as DeviceType)} size={22} />
                                        </div>

                                        <div>
                                            <div className="font-medium">{timer.name}</div>
                                            <div className="text-sm text-muted-foreground">{device.name}</div>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <HugeiconsIcon icon={Clock01Icon} size={14} />
                                                <span>{timer.time}</span>
                                                <span>•</span>
                                                <span>{timer.action.label}</span>
                                                <span>•</span>
                                                <span>{daysDisplay}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {showDelete && (
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="rounded-xl"
                                                onClick={() => {
                                                    setTimers((prev) => prev.filter((t) => t.id !== timer.id));
                                                    setSelectedTimerId(null);
                                                }}>
                                                <HugeiconsIcon icon={Delete02Icon} size={18} />
                                            </Button>
                                        )}
                                        <Switch
                                            checked={timer.enabled}
                                            onCheckedChange={(checked) =>
                                                setTimers((prev) =>
                                                    prev.map((t) => t.id === timer.id ? { ...t, enabled: checked } : t)
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

            {/* Action Selection Drawer */}

        </div >
    );
}
