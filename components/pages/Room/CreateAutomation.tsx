"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Cancel01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Device } from "@/db/types/devive";
import { useForm } from "react-hook-form";
import ActionSelectionDrawer from "./ActionSelectionDrawer";
import { cn } from "@/libs/utils";

export type DeviceType = "LIGHT" | "AC" | "TV" | "SWITCH";

export interface TimerAction {
    type: string;
    value: any;
    label: string;
}

export interface AutomationFormValues {
    name: string;
    operator: string; 
    conditionValue: string;
    actionDeviceId: string;
    action: TimerAction | undefined;
}

export interface CreateAutomationDrawerProps {
    devices: Device[];
    onCreateAutomation: (finalData: any) => void;
    onCancel: () => void;
    initialData?: any;
    getDeviceIcon: (type: string) => any; 
}

export default function CreateAutomation({
    devices = [], 
    onCreateAutomation,
    onCancel,
    initialData,
    getDeviceIcon,
}: CreateAutomationDrawerProps) {
    const form = useForm<AutomationFormValues>({
        defaultValues: initialData || {
            name: "",
            operator: "", 
            conditionValue: "28", 
            actionDeviceId: "",
            action: undefined,
        },
    });

    const { register, watch, setValue, handleSubmit } = form;



    // Quản lý trạng thái hành động (THÌ)
    const [showActionDrawer, setShowActionDrawer] = useState(false);
    const [selectedActionDevice, setSelectedActionDevice] = useState<Device | null>(null);

    const watchActionDeviceId = watch("actionDeviceId");
    const watchAction = watch("action");
    const watchConditionValue = watch("conditionValue") || "28";

    // Khôi phục dữ liệu cũ nếu chỉnh sửa kịch bản có sẵn
    useEffect(() => {
        if (initialData?.actionDeviceId) {
            const dev = (devices || []).find(d => d.id === initialData.actionDeviceId);
            if (dev) setSelectedActionDevice(dev);
        }
        
        // BẠN HÃY XÓA ĐOẠN NÀY ĐI:
        // if (initialData?.operator) {
        //     setSelectedConditionLabel(...) 
        // }
        // VÌ GIAO DIỆN MỚI DÙNG REACT-HOOK-FORM ĐÃ TỰ ĐỘNG BẮT ĐƯỢC RỒI!
        
    }, [initialData, devices]);

    // Xử lý tăng giảm nhiệt độ bằng nút cộng trừ
    const handleDecrement = () => {
        const current = parseInt(watchConditionValue, 10) || 0;
        setValue("conditionValue", String(current - 1));
    };

    const handleIncrement = () => {
        const current = parseInt(watchConditionValue, 10) || 0;
        setValue("conditionValue", String(current + 1));
    };

    const handleActionDeviceClick = (device: Device) => {
        setValue("actionDeviceId", device.id);
        setSelectedActionDevice(device);
        setShowActionDrawer(true);
    };

    const handleSelectAction = (selectedAction: TimerAction) => {
        setValue("action", selectedAction);
        setShowActionDrawer(false);
    };

    return (
    <div className="px-4 pb-40 space-y-4 overflow-y-auto select-text">

        {/* Tên tự động hóa */}
        <div>
            <div className="mb-2 text-sm font-medium">Tên tự động hóa</div>
            <Input
                placeholder="Ví dụ: Tự động bật điều hòa khi nóng"
                {...register("name")}
            />
        </div>

        {/* ĐIỀU KIỆN (NẾU) - Giao diện Card cố định không gây giật layout */}
        <div className="bg-card rounded-3xl border border-border/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground uppercase tracking-wider">Điều kiện (NẾU)</span>
                
                {/* Dùng Select bọc giao diện cho gọn nhẹ và dễ hiểu */}
                <select
                    {...register("operator")}
                    className="bg-muted/50 border border-border/50 text-sm font-medium rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer transition-colors hover:bg-muted"
                >
                    <option value="" disabled>-- Chọn điều kiện --</option>
                    <option value=">">📈 Nhiệt độ trên</option>
                    <option value="<">📉 Nhiệt độ dưới</option>
                </select>
            </div>

            {/* Khung nhiệt độ luôn giữ nguyên chiều cao, dùng Opacity để hiện/ẩn mượt mà */}
            <div className={cn(
                "flex items-center justify-between border border-border/50 rounded-2xl p-4 transition-all duration-300",
                watch("operator") ? "bg-background opacity-100" : "bg-muted/20 opacity-40 pointer-events-none"
            )}>
                <div>
                    <div className="font-semibold text-sm text-foreground">
                        {watch("operator") === ">" ? "Nhiệt độ trên" : watch("operator") === "<" ? "Nhiệt độ dưới" : "Ngưỡng kích hoạt"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Kích hoạt khi đạt mức này</div>
                </div>
                
                {/* Cụm nút cộng trừ tăng giảm số */}
                <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-xl p-1 shadow-sm">
                    <button
                        type="button"
                        onClick={handleDecrement}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background transition-colors text-lg font-semibold active:scale-90 select-none"
                    >
                        －
                    </button>
                    <div className="flex items-center justify-center min-w-[3rem]">
                        {/* Đã áp dụng React Hook Form chuẩn cho TextBox */}
                        <input
                            type="number"
                            className="w-8 text-center bg-transparent text-sm font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            {...register("conditionValue")}
                        />
                        <span className="text-sm font-bold text-foreground select-none">°C</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleIncrement}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background transition-colors text-lg font-semibold active:scale-90 select-none"
                    >
                        ＋
                    </button>
                </div>
            </div>
        </div>

        {/* Chọn thiết bị và hành động */}
        <div>
            <div className="mb-2 text-sm font-medium">Chọn thiết bị và hành động</div>
            <div className="grid gap-2">
                {(devices || []).map((device) => {
                    const isActive = watchActionDeviceId === device.id;
                    return (
                        <button
                            key={device.id}
                            type="button"
                            onClick={() => handleActionDeviceClick(device)}
                            className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                                isActive ? "border-primary bg-primary/10" : "border-border"
                            }`}
                        >
                            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                                <HugeiconsIcon icon={getDeviceIcon(device.type || "")} size={20} />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-medium">{device.name}</div>
                                <div className="text-xs text-muted-foreground">{device.type}</div>
                            </div>
                            {isActive && watchAction?.label && (
                                <Badge variant="secondary" className="ml-auto animate-in fade-in duration-200 truncate max-w-[120px]">
                                    {watchAction.label}
                                </Badge>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Nút bấm */}
        <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1 gap-2 rounded-2xl" onClick={onCancel}>
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
                Hủy
            </Button>
            <Button
                type="button"
                className="flex-1 gap-2 rounded-2xl"
                disabled={!watch("operator") || !watchActionDeviceId || !watchAction}
                onClick={handleSubmit(onCreateAutomation)}
            >
                <HugeiconsIcon icon={PlayIcon} size={18} />
                Lưu kịch bản
            </Button>
        </div>

        {/* Drawer chọn hành động */}
        <ActionSelectionDrawer
            open={showActionDrawer}
            onOpenChange={setShowActionDrawer}
            device={selectedActionDevice}
            currentAction={watchAction}
            onSelectAction={handleSelectAction}
        />
    </div>
);
}