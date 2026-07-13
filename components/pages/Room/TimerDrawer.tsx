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
import { roomRepo } from "@/db/repository/RoomRepository";
import { Room } from "@/db/types/room";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import HelpButton from "@/components/common/HelpButton";
import { startTimerTour } from "@/components/onboarding/tours/timerTour";
import { toast } from "sonner";

type DeviceType = "LIGHT" | "AC" | "TV" | "SWITCH";

interface TimerAction {
    type: "power" | "temp" | "brightness" | "color" | "volume" | "channel" | "autoTemp" | "LEARNING_REMOTE";
    value: string | number | boolean;
    label: string;
    command?: string;
    key?: string;
    name?: string;
    remoteButtonId?: string;
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

const DAY_TO_ESP_VALUE: Record<DayOfWeek, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 0,
};

const normalizeActionForEsp = (action: any) => {
    if (!action) return { type: "power", value: "OFF" };

    if (action.type === "LEARNING_REMOTE") {
        const key = action.key ?? action.value;

        return {
            type: "LEARNING_REMOTE",
            value: key,
            command: action.command ?? "SEND",
            key,
            name: action.name ?? action.label,
            remoteButtonId: action.remoteButtonId,
        };
    }

    if (action.type === "autoTemp") {
        return {
            type: "autoTemp",
            value: "ON",
            temp: Number(action.temp ?? action.temperature ?? 26),
        };
    }

    return {
        type: action.type ?? "power",
        value: action.value ?? "OFF",
    };
};

function buildConfigAndPayload(data: any, devices: Device[], roomId: string, existingId?: string) {
    const id = existingId ?? crypto.randomUUID();
    const selectedDevice = devices.find(d => d.id === data.deviceId);
    const deviceType = selectedDevice?.type ?? "LIGHT";
    const config = {
        id,
        room_id: roomId,
        name: data.name || data.action?.label || "Hẹn giờ",
        config_type: data.repeat ? "SCHEDULE" : "TIMER",
        device_id: data.deviceId,
        device_type: deviceType,
        power: String(data.action?.value || "OFF"),
        trigger_time: data.time || "00:00",
        days_of_week: JSON.stringify(data.days || []),
        duration_minutes: null,
        action: JSON.stringify(data.action || {}),
        is_active: 1,
    };
    const payload = {
        id,
        deviceName: selectedDevice?.name ?? data.deviceId,
        time: data.time || "00:00",
        endTime: data.endTime || data.time || "00:00",
        repeat: data.repeat ?? true,
        days: (data.days || []).map((day: DayOfWeek) => DAY_TO_ESP_VALUE[day]).filter((day: number | undefined) => day !== undefined),
        actions: [normalizeActionForEsp(data.action)],
    };
    return { config, payload };
}

export function TimerUI({ roomId }: { roomId: string }) {
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const { open, back } = useNavDrawer();
    const { send } = useTransport();
    const [room, setRoom] = useState<Room | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [timers, setTimers] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    const loadData = async () => {
        if (!roomId) return;

        const [roomDevices, roomInfo] = await Promise.all([
            deviceRepo.getByRoom(roomId),
            roomRepo.getById(roomId)
        ]);
        setDevices(roomDevices);
        setRoom(roomInfo);

        const allConfigs = await configRepo.findAll();
        const roomDeviceIds = roomDevices.map(d => d.id);

        const roomTimers = allConfigs
            .filter(config =>
                roomDeviceIds.includes(config.device_id) &&
                ["TIMER", "SCHEDULE"].includes(config.config_type)
            )
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

    const sendTimerPayload = async (payload: any, topic: string) => {
        if (!room?.name) {
            toast.warning("Đã lưu hẹn giờ, nhưng chưa có thông tin Hub để gửi xuống thiết bị.");
            return false;
        }

        try {
            await send(payload, topic);
            return true;
        } catch (error) {
            console.warn("Không thể gửi hẹn giờ xuống thiết bị:", error);
            toast.warning("Đã lưu hẹn giờ. Thiết bị đang offline nên chưa gửi xuống Hub.");
            return false;
        }
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
            renderHelpButtonHeader: <HelpButton onClick={() => startTimerTour(true)} />,
            props: {
                devices,
                ...(timer && { initialData: timer }),
                onCreateTimer: async (data: any) => {
                    const { config, payload } = buildConfigAndPayload(data, devices, roomId, timer?.id);
                    if (timer) {
                        await configRepo.upsertConfig(config);
                        await sendTimerPayload(payload, `device/${room?.name}/auto/set`);
                    } else {
                        await configRepo.upsertConfig(config);
                        await sendTimerPayload(payload, `device/${room?.name}/auto/set`);
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

            <div className="flex items-start justify-between px-4 pt-2 pb-1 flex-shrink-0">

                {/* Góc trái: Nút Xóa/Xong (Đẩy xuống 1 chút cho cân bằng với nút Thêm) */}
                <Button
                    variant="ghost"
                    className="text-foreground hover:text-foreground font-medium p-0 h-auto mt-8 hover:bg-transparent text-base transition-colors"
                    onClick={() => {
                        setIsEditing(!isEditing);
                        setDeleteConfirmId(null);
                    }}
                >
                    {isEditing ? "Xong" : "Xoá"}
                </Button>

                {/* Góc phải: Đổi thành flex-col để nút ? nằm TRÊN nút Thêm */}
                <div className="flex flex-col items-end gap-3">


                    <Button
                        data-tour="timer-add-btn"
                        variant="default"
                        className="bg-foreground text-background hover:bg-foreground/90 gap-1.5 rounded-2xl px-4 h-9 text-sm font-medium transition-colors flex items-center justify-center relative z-[60]"
                        onClick={() => {
                            // 🟢 KIỂM TRA: Nếu Tour đang chạy mà bấm nút này, thì lưu cờ chuyển tiếp
                            const isTourRunning = document.querySelector('.driver-active-element') !== null;
                            if (isTourRunning) {
                                sessionStorage.setItem("timer_tour_active", "true");
                                // Tắt tour cũ ở ngoài đi
                                import('@/components/onboarding/tours/timerTour').then(m => m.timerDriverObj?.destroy());
                            }

                            openTimerDrawer(); // Mở drawer bình thường
                        }}>
                        <HugeiconsIcon icon={AddCircleIcon} size={28} />
                        Thêm hẹn giờ
                    </Button>
                </div>
            </div>

            {/* 2. Vùng danh sách: Cho phép cuộn */}
            <div className="flex-1 overflow-y-auto px-4 pt-1" data-tour="timer-list-area">
                <div className="w-full space-y-3 pb-6">
                    {timers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                                <HugeiconsIcon onClick={() => openTimerDrawer()} icon={AddCircleIcon} size={32} className="text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-base">Chưa có hẹn giờ nào</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Hãy bắt đầu bằng cách tạo hẹn giờ đầu tiên của bạn.
                                </div>
                            </div>
                            {/* <Button
                                variant="default"
                                className="bg-foreground text-background hover:bg-foreground/90 gap-1.5 rounded-2xl px-6"
                                onClick={() => openTimerDrawer()}
                            >
                                <HugeiconsIcon icon={AddCircleIcon} size={18} />
                                Tạo hẹn giờ
                            </Button> */}
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
                                                await configRepo.deleteConfig(timer.id);
                                                const payload = { id: timer.id };
                                                await sendTimerPayload(payload, `device/${room?.name}/auto/delete`);
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
