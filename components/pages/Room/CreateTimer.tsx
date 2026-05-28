"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Cancel01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Switch } from "@/components/ui/switch";
import { Device } from "@/db/types/devive";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { TimerFormValues } from "./TimerDrawer";

// Import các thành phần Drawer (Thường từ shadcn UI)
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/libs/utils";

export type DeviceType = "light" | "ac" | "tv" | "switch";
export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

// Định nghĩa bổ sung các Type thiếu để tránh lỗi Compile
export interface TimerAction {
    type: string;
    value: any;
    label: string;
}

export interface CreateTimerDrawerProps {
    form?: UseFormReturn<TimerFormValues>; // Chuyển thành optional nếu bạn tự khởi tạo useForm bên trong
    devices: Device[];
    onSelectDevice: (device: Device) => void;
    onCreateTimer: (finalData: any) => void;
    onCancel: () => void;
    getDeviceIcon: (type: DeviceType) => any;
}

export const DAYS_OF_WEEK: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const DAYS_LABELS: Record<DayOfWeek, string> = {
    Monday: "T2", Tuesday: "T3", Wednesday: "T4", Thursday: "T5", Friday: "T6", Saturday: "T7", Sunday: "CN"
};

// Giả lập dữ liệu hành động (Thay bằng dữ liệu thật từ dự án của bạn)
export const DEVICE_ACTIONS: Record<DeviceType, TimerAction[]> = {
    light: [
        { type: "power", value: "ON", label: "Bật đèn" },
        { type: "power", value: "OFF", label: "Tắt đèn" }
    ],
    ac: [
        { type: "power", value: "ON", label: "Bật điều hòa" },
        { type: "power", value: "OFF", label: "Tắt điều hòa" }
    ],
    tv: [
        { type: "power", value: "ON", label: "Bật TV" },
        { type: "power", value: "OFF", label: "Tắt TV" }
    ],
    switch: [
        { type: "status", value: "ON", label: "Bật công tắc" },
        { type: "status", value: "OFF", label: "Tắt công tắc" }
    ],
};

export default function CreateTimerDrawer({
    devices,
    onSelectDevice,
    onCreateTimer,
    onCancel,
    getDeviceIcon,
}: CreateTimerDrawerProps) {

    const form = useForm<TimerFormValues>({
        defaultValues: {
            name: "",
            time: "",
            days: [],
            repeat: false,
            deviceId: "",
            action: undefined, // Khởi tạo trường action trong form
        } as any,
    });

    const { register, control, watch, setValue, handleSubmit } = form;

    // --- FIX 1: Khai báo các State bị thiếu ---
    const [showActionDrawer, setShowActionDrawer] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    const selectedDays = watch("days") || [];
    const deviceId = watch("deviceId");
    const action = watch("action") as TimerAction | undefined;

    // Hàm xử lý khi nhấn vào 1 thiết bị trong danh sách
    const handleDeviceClick = (device: Device) => {
        setValue("deviceId", device.id); // Cập nhật id thiết bị vào form
        setSelectedDevice(device);       // Lưu thiết bị đang chọn vào state
        setShowActionDrawer(true);       // Mở drawer chọn hành động lên
        onSelectDevice(device);          // Gọi callback của component cha (nếu cần)
    };

    // Hàm xử lý sau khi chọn xong hành động từ Drawer con
    const handleSelectAction = (selectedAction: TimerAction) => {
        setValue("action", selectedAction as any); // Lưu hành động vào react-hook-form
        setShowActionDrawer(false);                // Đóng drawer chọn hành động
    };

    return (
        <div className="px-4 pb-6 space-y-4 h-[70vh] overflow-auto select-text">
            {/* Tên hẹn giờ */}
            <div>
                <div className="mb-2 text-sm font-medium">Tên hẹn giờ</div>
                <Input
                    placeholder="Ví dụ: Tắt TV"
                    {...register("name")}
                />
            </div>

            {/* Chọn thời gian */}
            <div>
                <div className="mb-2 text-sm font-medium">Chọn thời gian</div>
                <Input
                    type="time"
                    {...register("time")}
                />
            </div>

            {/* Chọn ngày */}
            <div>
                <div className="mb-2 text-sm font-medium">Chọn ngày</div>
                <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                        const isSelected = selectedDays.includes(day);
                        return (
                            <Button
                                key={day}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className="rounded-xl"
                                onClick={() => {
                                    const newDays = isSelected
                                        ? selectedDays.filter((d) => d !== day)
                                        : [...selectedDays, day];
                                    setValue("days", newDays);
                                }}
                            >
                                {DAYS_LABELS[day]}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Chọn thiết bị */}
            <div>
                <div className="mb-2 text-sm font-medium">Chọn thiết bị</div>
                <div className="grid gap-2">
                    {devices.map((device) => {
                        const active = deviceId === device.id;
                        return (
                            <button
                                key={device.id}
                                type="button"
                                onClick={() => handleDeviceClick(device)} // FIX 3: Dùng hàm bọc mới để kích hoạt mở drawer hành động
                                className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${active ? "border-primary bg-primary/10" : "border-border"
                                    }`}
                            >
                                <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                                    <HugeiconsIcon icon={getDeviceIcon(device.type as DeviceType)} size={20} />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-medium">{device.name}</div>
                                    <div className="text-xs text-muted-foreground">{device.type as DeviceType}</div>
                                </div>
                                {active && action?.label && (
                                    <Badge variant="secondary" className="ml-auto animate-in fade-in duration-200">
                                        {action.label}
                                    </Badge>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Lặp lại */}
            <div className="flex items-center justify-between rounded-2xl border p-3">
                <div>
                    <div className="font-medium">Lặp lại</div>
                    <div className="text-xs text-muted-foreground">Chạy mỗi ngày đã chọn</div>
                </div>
                <Controller
                    control={control}
                    name="repeat"
                    render={({ field }) => (
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
            </div>

            {/* Hệ thống nút bấm */}
            <div className="flex gap-2 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2 rounded-2xl"
                    onClick={onCancel}
                >
                    <HugeiconsIcon icon={Cancel01Icon} size={18} />
                    Hủy
                </Button>
                <Button
                    type="button"
                    className="flex-1 gap-2 rounded-2xl"
                    disabled={!deviceId}
                    onClick={handleSubmit(onCreateTimer)}
                >
                    <HugeiconsIcon icon={PlayIcon} size={18} />
                    Lưu timer
                </Button>
            </div>

            {/* Drawer chọn hành động */}
            <ActionSelectionDrawer
                open={showActionDrawer}
                onOpenChange={setShowActionDrawer}
                device={selectedDevice}
                currentAction={action}
                onSelectAction={handleSelectAction}
            />
        </div>
    );
}

interface ActionSelectionDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    device: Device | null;
    currentAction: TimerAction | undefined;
    onSelectAction: (action: TimerAction) => void;
}

function ActionSelectionDrawer({ open, onOpenChange, device, currentAction, onSelectAction }: ActionSelectionDrawerProps) {
    if (!device) return null;

    const availableActions = DEVICE_ACTIONS[device.type as DeviceType] || [];

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="mx-auto rounded-2xl bg-white mt-40 w-full z-[9999]">
                <DrawerHeader>
                    <DrawerTitle>Chọn hành động</DrawerTitle>
                    <DrawerDescription>{device.name}</DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-6 space-y-2">
                    {availableActions.map((action, index) => {
                        // FIX 4: Thêm Optional Chaining (?.) để tránh crash ứng dụng khi currentAction chưa có dữ liệu ban đầu
                        const isSelected = action.type === currentAction?.type && action.value === currentAction?.value;

                        return (
                            <button
                                key={`${action.type}-${index}`}
                                type="button"
                                onClick={() => onSelectAction(action)}
                                className={cn(
                                    "w-full flex items-center justify-between rounded-2xl border p-4 transition-all",
                                    isSelected ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-foreground"
                                )}
                            >
                                <div className="text-left">
                                    <div className="font-medium">{action.label}</div>
                                    <div className="text-xs opacity-60">
                                        {action.type}: {String(action.value)}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
