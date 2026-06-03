"use client";
import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Clock01Icon,
    IcoIcon,
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
        <div className="w-full max-w-xl mx-auto px-4 pt-1 pb-40 max-h-[80vh] overflow-y-auto select-none selection:bg-transparent bg-background">
            
            <div className="flex items-center justify-between w-full pb-3 pt-1 flex-shrink-0 border-none">
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
                <Button
                    variant="ghost"
                    className="text-orange-500 hover:text-orange-600 p-0 h-auto w-auto hover:bg-transparent transition-colors flex items-center justify-center"
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
                                    
                                    // 1. Tìm thông tin thiết bị để lấy device_type bắt buộc
                                    const targetDevice = devices.find(d => d.id === data.deviceId);
                                    const deviceType = targetDevice ? targetDevice.type : "LIGHT";
                                    
                                    // 2. Lấy giá trị power từ hành động được chọn (ON/OFF)
                                    const powerValue = data.action?.value || "OFF";
                                    
                                    // 3. Phân biệt loại config dựa trên nút Lặp lại (repeat)
                                    const configType = data.repeat ? "SCHEDULE" : "TIMER";

                                    const newConfig = {
                                        id: newId,
                                        name: data.name || data.action?.label || "Hẹn giờ",
                                        config_type: configType,         // ĐÃ BỔ SUNG
                                        device_id: data.deviceId,
                                        device_type: deviceType,         // ĐÃ BỔ SUNG
                                        power: String(powerValue),       // ĐÃ BỔ SUNG
                                        trigger_time: data.time || "00:00",
                                        days_of_week: JSON.stringify(data.days || []),
                                        action: JSON.stringify(data.action || {}),
                                        is_active: 1                      // Mặc định tạo mới là BẬT
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
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="36" 
                        height="36" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="transition-transform active:scale-90"
                    >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </Button>
            </div>

            <div className="w-full space-y-3 pt-1 pr-1.5">
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
                                        // 1. Lấy thông tin cập nhật bổ sung tương tự như lúc tạo mới
                                        const targetDevice = devices.find(d => d.id === data.deviceId);
                                        const deviceType = targetDevice ? targetDevice.type : "LIGHT";
                                        const powerValue = data.action?.value || "OFF";
                                        const configType = data.repeat ? "SCHEDULE" : "TIMER";

                                        await configRepo.update(timer.id, {
                                            name: data.name || data.action?.label || "Hẹn giờ",
                                            config_type: configType,     // ĐÃ BỔ SUNG
                                            device_id: data.deviceId,
                                            device_type: deviceType,     // ĐÃ BỔ SUNG
                                            power: String(powerValue),   // ĐÃ BỔ SUNG
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
                                    "relative z-10 flex w-full items-center transition-transform duration-300 ease-in-out bg-transparent",
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
                                        <Card className="rounded-none border-none p-4 bg-transparent shadow-none transition-colors duration-200 active:bg-muted/60">
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

                                                <div className={cn(
                                                    "flex items-center transition-all duration-200 origin-right ml-2 flex-shrink-0",
                                                    isEditing ? "opacity-0 scale-50 pointer-events-none hidden" : "opacity-100 scale-100"
                                                )}>
                                                    <Switch
                                                        checked={timer.enabled}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onCheckedChange={async (checked) => {
                                                            await configRepo.update(timer.id, { is_active: checked ? 1 : 0 });
                                                            setTimers((prev) =>
                                                                prev.map((t) => t.id === timer.id ? { ...t, enabled: checked } : t)
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                    
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}