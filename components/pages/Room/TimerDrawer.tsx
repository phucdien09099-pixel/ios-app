"use client";
import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Clock01Icon,
    IcoIcon,
    AddCircleIcon,
} from "@hugeicons/core-free-icons";
import { useRef, useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import CreateTimerDrawer from "./CreateTimer";
import { Device } from "@/db/types/devive";
import { deviceRepo } from "@/db/repository/DeviceRepository";
import { configRepo } from "@/db/repository/ConfigRepository";
import { useTransport } from "@/components/providers/transport/TransportProvider";

type DeviceType = "LIGHT" | "AC" | "TV" | "SWITCH";

interface TimerAction {
    type: "power" | "temp" | "brightness" | "color" | "volume" | "channel";
    value: string | number | boolean;
    label: string;
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

export const DAYS_LABELS: Record<DayOfWeek, string> = {
    Monday: "T2",
    Tuesday: "T3",
    Wednesday: "T4",
    Thursday: "T5",
    Friday: "T6",
    Saturday: "T7",
    Sunday: "CN",
};

function buildConfigAndPayload(data: any, devices: Device[], existingId?: string) {
    const id = existingId ?? crypto.randomUUID();
    const deviceType = devices.find(d => d.id === data.deviceId)?.type ?? "LIGHT";
    const config = {
        id,
        name: data.name || data.action?.label || "Hẹn giờ",
        config_type: data.repeat ? "SCHEDULE" : "TIMER",
        device_id: data.deviceId,
        device_type: deviceType,
        power: String(data.action?.value || "OFF"),
        trigger_time: data.time || "00:00",
        days_of_week: JSON.stringify(data.days || []),
        action: JSON.stringify(data.action || {}),
        is_active: 1,
    };
    const payload = {
        id,
        time: data.time,
        repeat: data.repeat,
        days: data.days || [],
        device: deviceType,
        actions: [data.action],
    };
    return { config, payload };
}

export function TimerUI({ roomId }: { roomId: string }) {
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const { open, back } = useNavDrawer();
    const { send } = useTransport();

    const [devices, setDevices] = useState<Device[]>([]);
    const [timers, setTimers] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    const loadData = async () => {
        if (!roomId) return;

        const roomDevices = await deviceRepo.getByRoom(roomId);
        setDevices(roomDevices);

        const allConfigs = await configRepo.findAll();
        const roomDeviceIds = roomDevices.map(d => d.id);

        const roomTimers = allConfigs
            .filter(config => roomDeviceIds.includes(config.device_id))
            .map(config => {
                const actionObj = config.action ? JSON.parse(config.action) : { label: "Hành động" };
                const daysArr = config.days_of_week ? JSON.parse(config.days_of_week) : [];
                return {
                    id: config.id,
                    deviceId: config.device_id,
                    time: config.trigger_time,
                    enabled: config.is_active === 1,
                    action: actionObj,
                    days: daysArr,
                    name: config.name || actionObj.label,
                    repeat: config.config_type === 'SCHEDULE'
                };
            });

        setTimers(roomTimers);
    };

    useEffect(() => {
        loadData();
    }, [roomId]);

    const getDeviceIcon = (type: DeviceType) => {
        return IcoIcon;
    };

    const openTimerDrawer = (timer?: any) =>
        open({
            id: timer ? "editTimer" : "createTimer",
            title: timer ? "Sửa thông tin hẹn giờ" : "Tạo timer",
            direction: 'bottom',
            className: 'mt-[8vh]! w-screen bg-background rounded-t-2xl',
            component: CreateTimerDrawer,
            props: {
                devices,
                ...(timer && { initialData: timer }),
                onCreateTimer: async (data: any) => {
                    const { config, payload } = buildConfigAndPayload(data, devices, timer?.id);
                    console.log(config);
                    if (timer) {
                        const { id: _id, is_active: _ia, ...updateData } = config;
                        await send({ ...payload, id: data.deviceId }, "auto/set");
                        await configRepo.update(timer.id, updateData);
                    } else {
                        await send(payload, "auto/set");
                        await configRepo.create(config);
                    }
                    await loadData();
                    back();
                },
                onCancel: back,
                getDeviceIcon,
            },
        });

    return (
        // 1. Khung tổng: Cố định chiều cao, không cuộn
        <div className="flex flex-col w-full max-w-xl mx-auto h-full max-h-[75vh] bg-background">

            <div className="flex items-center justify-between px-4 pt-2 pb-1 flex-shrink-0">
                <Button
                    variant="ghost"
                    className="text-foreground hover:text-foreground font-medium p-0 h-auto hover:bg-transparent text-base transition-colors"
                    onClick={() => {
                        setIsEditing(!isEditing);
                        setDeleteConfirmId(null);
                    }}
                >
                    {isEditing ? "Xong" : "Xoá"}
                </Button>
                <Button
                    variant="default"
                    className="bg-foreground text-background hover:bg-foreground/90 gap-1.5 rounded-2xl px-4 h-9 text-sm font-medium transition-colors flex items-center justify-center"
                    onClick={() => openTimerDrawer()}
                >
                    <HugeiconsIcon icon={AddCircleIcon} size={28} />
                    Thêm hẹn giờ
                </Button>
            </div>

            {/* 2. Vùng danh sách: Cho phép cuộn */}
            <div className="flex-1 overflow-y-auto px-4 pt-1">
                <div className="w-full space-y-3 pb-6">
                    {timers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                                <HugeiconsIcon icon={Clock01Icon} size={32} className="text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-base">Chưa có hẹn giờ nào</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Hãy bắt đầu bằng cách tạo hẹn giờ đầu tiên của bạn.
                                </div>
                            </div>
                            <Button
                                variant="default"
                                className="bg-foreground text-background hover:bg-foreground/90 gap-1.5 rounded-2xl px-6"
                                onClick={() => openTimerDrawer()}
                            >
                                <HugeiconsIcon icon={AddCircleIcon} size={18} />
                                Tạo hẹn giờ
                            </Button>
                        </div>
                    ) : (
                        timers.map((timer) => {
                            const device = devices.find((d) => d.id === timer.deviceId);
                            if (!device) return null;

                            const isDeletingThis = deleteConfirmId === timer.id;
                            const daysDisplay = timer.days.length === 7
                                ? "Hàng ngày"
                                : timer.days.length === 0
                                    ? "Một lần"
                                    : timer.days.map((d: DayOfWeek) => DAYS_LABELS[d]).join(", ");

                            return (
                                <div key={timer.id} className="relative w-full overflow-hidden rounded-3xl border border-border/50 bg-card">

                                    {/* 1. Nút Xoá nền đỏ ẩn ở dưới (Sẽ hiện ra khi isEditing = true) */}
                                    <div className={cn(
                                        "absolute right-0 top-0 bottom-0 z-0 flex w-24 items-center justify-end transition-opacity duration-300",
                                        isEditing ? "opacity-100" : "opacity-0"
                                    )}>
                                        <Button
                                            variant="destructive"
                                            className="h-full w-full rounded-none rounded-r-3xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await configRepo.delete(timer.id);
                                                const payload = {
                                                    id: timer.id
                                                }
                                                await send(payload, "auto/delete");

                                                setTimers((prev) => prev.filter((t) => t.id !== timer.id));
                                            }}>
                                            Xóa
                                        </Button>
                                    </div>

                                    {/* 2. Nội dung chính (Trượt sang trái khi isEditing = true) */}
                                    <div className={cn(
                                        "relative z-10 flex w-full items-center transition-transform duration-300 ease-in-out bg-card",
                                        isEditing ? "-translate-x-24" : "translate-x-0"
                                    )}>

                                        {/* ĐÃ XÓA HOÀN TOÀN NÚT DẤU TRỪ ĐỎ Ở ĐÂY */}

                                        {/* 3. Phần thông tin thiết bị (Gộp class siêu gọn, sạch bóng gạch dọc/viền) */}
                                        <div
                                            className="flex-1 min-w-0 p-4 transition-colors duration-200 active:bg-muted/60 cursor-pointer"
                                            onClick={() => openTimerDrawer(timer)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                                                        <HugeiconsIcon icon={getDeviceIcon(device.type as any)} size={22} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-semibold text-base truncate">{timer.name}</div>
                                                        <div className="text-xs text-muted-foreground truncate">{device.name}</div>
                                                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground/80">
                                                            <HugeiconsIcon icon={Clock01Icon} size={13} className="flex-shrink-0" />
                                                            <span className="font-medium text-foreground/90">{timer.time}</span>
                                                            <span>•</span>
                                                            <span className="truncate max-w-[100px]">{timer.action?.label || 'Chưa có hành động'}</span>
                                                            <span>•</span>
                                                            <span className="truncate">{daysDisplay}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4. Nút Switch giữ nguyên */}
                                        <div className={cn(
                                            "flex items-center transition-all duration-200 origin-right pr-4 flex-shrink-0",
                                            isEditing ? "opacity-0 scale-50 pointer-events-none hidden" : "opacity-100 scale-100"
                                        )}
                                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                            onPointerDown={(e) => e.stopPropagation()}>
                                            <Switch
                                                checked={timer.enabled}
                                                onCheckedChange={async (checked) => {
                                                    await configRepo.update(timer.id, { is_active: checked ? 1 : 0 });
                                                    setTimers((prev) =>
                                                        prev.map((t) => t.id === timer.id ? { ...t, enabled: checked } : t)
                                                    );
                                                }}
                                            />
                                        </div>
                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
