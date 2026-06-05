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
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import CreateTimerDrawer from "./CreateTimer";
import { Device } from "@/db/types/devive";
import { deviceRepo } from "@/db/repository/DeviceRepository";
import { configRepo } from "@/db/repository/ConfigRepository";

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

export function TimerUI({ roomId }: { roomId: string }) {
    const [selectedTimerId, setSelectedTimerId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    
    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const { open, back } = useNavDrawer();

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

    return (
        // 1. Khung tổng: Cố định chiều cao, không cuộn
        <div className="flex flex-col w-full max-w-xl mx-auto h-full max-h-[75vh] bg-background">
            
            {/* Nút Sửa / Xong ở trên cùng bên trái */}
            <div className="flex items-center justify-start px-4 pt-2 pb-1 flex-shrink-0">
                <Button 
                    variant="ghost" 
                    className="text-orange-500 hover:text-orange-600 font-medium p-0 h-auto hover:bg-transparent text-base md:text-lg transition-colors"
                    onClick={() => {
                        setIsEditing(!isEditing);
                        setDeleteConfirmId(null);
                    }}
                >
                    {isEditing ? "Xong" : "Sửa"}
                </Button>
            </div>

            {/* 2. Vùng danh sách: Cho phép cuộn */}
            <div className="flex-1 overflow-y-auto px-4 pt-1">
                <div className="w-full space-y-3 pb-6">
                    {timers.length === 0 ? (
                        <div className="py-20 text-center text-sm text-muted-foreground">
                            Chưa có thiết bị nào được cài đặt timer
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

                            const handleOpenEdit = () => {
                                open({
                                    id: "editTimer",
                                    title: "Sửa thông tin hẹn giờ",
                                    direction: 'bottom',
                                    className: 'mt-[8vh]! w-screen bg-background rounded-t-2xl',
                                    component: CreateTimerDrawer,
                                    props: {
                                        devices,
                                        initialData: timer,
                                        onCreateTimer: async (data: any) => {
                                            const targetDevice = devices.find(d => d.id === data.deviceId);
                                            const deviceType = targetDevice ? targetDevice.type : "LIGHT";
                                            const powerValue = data.action?.value || "OFF";
                                            const configType = data.repeat ? "SCHEDULE" : "TIMER";

                                            await configRepo.update(timer.id, {
                                                name: data.name || data.action?.label || "Hẹn giờ",
                                                config_type: configType,
                                                device_id: data.deviceId,
                                                device_type: deviceType,
                                                power: String(powerValue),
                                                trigger_time: data.time || "00:00",
                                                days_of_week: JSON.stringify(data.days || []),
                                                action: JSON.stringify(data.action || {}),
                                            });
                                            loadData();
                                            back();
                                        },
                                        onCancel: back,
                                        getDeviceIcon,
                                    }
                                });
                            };

                            return (
                                <div key={timer.id} className="relative w-full overflow-hidden rounded-3xl border border-border/50 bg-card">
                                    <div className={cn(
                                        "absolute right-0 top-0 bottom-0 z-0 flex w-24 items-center justify-end transition-opacity duration-300",
                                        isDeletingThis ? "opacity-100" : "opacity-0"
                                    )}>
                                        <Button
                                            variant="destructive"
                                            className="h-full w-full rounded-none rounded-r-3xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await configRepo.delete(timer.id);
                                                setTimers((prev) => prev.filter((t) => t.id !== timer.id));
                                                setDeleteConfirmId(null);
                                            }}
                                        >
                                            Xóa
                                        </Button>
                                    </div>

                                    <div className={cn(
                                        "relative z-10 flex w-full items-center transition-transform duration-300 ease-in-out bg-card", // Đổi bg-transparent thành bg-card để che nút xóa
                                        isDeletingThis ? "-translate-x-24" : "translate-x-0"
                                    )}>
                                        <div className={cn(
                                            "flex-shrink-0 flex items-center justify-center transition-all duration-300 ease-in-out overflow-hidden",
                                            isEditing ? "w-12 opacity-100" : "w-0 opacity-0"
                                        )}>
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirmId(isDeletingThis ? null : timer.id);
                                                }}
                                                className={cn(
                                                    "bg-red-500 text-white rounded-full size-[22px] flex items-center justify-center shadow-sm active:scale-90 transition-transform duration-300",
                                                    isDeletingThis && "rotate-90"
                                                )}
                                            >
                                                <div className="w-2.5 h-[2px] bg-white rounded-full" />
                                            </button>
                                        </div>

                                        <div 
                                            className="flex-1 min-w-0"
                                            onClick={handleOpenEdit}
                                        >
                                            <div className="rounded-none border-0 p-4 bg-transparent shadow-none transition-colors duration-200 active:bg-muted/60">
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
                                        </div>
                                        
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

            {/* 3. Vùng Nút: Cố định dưới đáy (Giống hệt CreateSmartSceneDrawer) */}
            <div className="shrink-0 p-3 pb-6 bg-background border-t shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.05)] z-10">
                <Button
                    className="w-full gap-2 rounded-2xl h-11"
                    onClick={() =>
                        open({
                            id: "createTimer",
                            title: "Tạo timer",
                            direction: 'bottom',
                            className: 'mt-[8vh]! w-screen bg-background rounded-t-2xl',
                            component: CreateTimerDrawer,
                            props: {
                                devices,
                                onCreateTimer: async (data: any) => {
                                    const newId = crypto.randomUUID();
                                    
                                    const targetDevice = devices.find(d => d.id === data.deviceId);
                                    const deviceType = targetDevice ? targetDevice.type : "LIGHT";
                                    const powerValue = data.action?.value || "OFF";
                                    const configType = data.repeat ? "SCHEDULE" : "TIMER";

                                    const newConfig = {
                                        id: newId,
                                        name: data.name || data.action?.label || "Hẹn giờ",
                                        config_type: configType,
                                        device_id: data.deviceId,
                                        device_type: deviceType,
                                        power: String(powerValue),
                                        trigger_time: data.time || "00:00",
                                        days_of_week: JSON.stringify(data.days || []),
                                        action: JSON.stringify(data.action || {}),
                                        is_active: 1
                                    };

                                    await configRepo.create(newConfig);
                                    loadData(); 
                                    back();
                                },
                                onCancel: back,
                                getDeviceIcon,
                            },
                        })
                    }
                >
                    <HugeiconsIcon icon={AddCircleIcon} />
                    Thêm hẹn giờ
                </Button>
            </div>
            
        </div>
    );
}