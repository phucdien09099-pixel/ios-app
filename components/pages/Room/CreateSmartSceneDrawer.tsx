"use client";

import { useState, useEffect } from "react";
import { Device } from "@/db/types/devive";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { deviceRepo } from "@/db/repository/DeviceRepository";
import { automationRepo } from "@/db/repository/AutomationRepository";
import { IcoIcon, AddCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { cn } from "@/libs/utils";
import CreateAutomation from "./CreateAutomation";
import { SceneTypeSelector } from "./SceneTypeSelector";

interface CreateSmartSceneDrawerProps {
    roomId: string;
}

const getAutomationConditionLabel = (triggerConfig: any, fallbackLabel: string) => {
    if (triggerConfig.automationMode === "sleep") {
        return `Ngủ ${triggerConfig.sleepTime || "22:30"} - thức ${triggerConfig.wakeTime || "06:30"} · ${triggerConfig.comfortTemperature || "26"}°C`;
    }

    if (triggerConfig.operator === ">") {
        return `Nhiệt độ trên ${triggerConfig.conditionValue}°C`;
    }

    if (triggerConfig.operator === "<") {
        return `Nhiệt độ dưới ${triggerConfig.conditionValue}°C`;
    }

    return fallbackLabel;
};

export default function CreateSmartSceneDrawer({ roomId }: CreateSmartSceneDrawerProps) {
    const { open, back } = useNavDrawer();
    const [devices, setDevices] = useState<Device[]>([]);
    const [automations, setAutomations] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const getDeviceIcon = (type: string) => IcoIcon;

    const loadData = async () => {
        if (!roomId) return;
        const [roomDevices, roomAutomations] = await Promise.all([
            deviceRepo.getByRoom(roomId),
            automationRepo.getByRoom(roomId),
        ]);
        setDevices(roomDevices);
        setAutomations(roomAutomations);
    };

    useEffect(() => {
        loadData();
    }, [roomId]);

    const handleSelectAutomation = () => {
        // 1. Đóng cái Menu "Chọn kịch bản" lại luôn
        back();
        
        // 2. Chờ 0.25s cho Menu trượt xuống mượt mà, rồi đẩy Form lên thay thế
        setTimeout(() => {
            open({
                id: "createAutomationForm",
                title: "Tạo tự động hóa",
                direction: "bottom",
                className: "mt-[8vh]! w-screen bg-background rounded-t-2xl",
                component: CreateAutomation,
                props: {
                    devices,
                    getDeviceIcon,
                    onCancel: back,
                    onCreateAutomation: async (finalData: any) => {
                        const targetDevice = devices.find(d => d.id === finalData.actionDeviceId);
                        await automationRepo.createAutomation({
                            room_id: roomId,
                            name: finalData.name || "Tự động hóa",
                            trigger_config: JSON.stringify({
                                automationMode: finalData.automationMode,
                                sleepTime: finalData.sleepTime,
                                wakeTime: finalData.wakeTime,
                                currentTemperature: finalData.currentTemperature,
                                comfortTemperature: finalData.comfortTemperature,
                                operator: finalData.operator,
                                conditionValue: finalData.conditionValue,
                            }),
                            device_id: finalData.actionDeviceId,
                            action: JSON.stringify(finalData.action || {}),
                            is_active: 1,
                        });
                        console.log({
                            room_id: roomId,
                            name: finalData.name || "Tự động hóa",
                            trigger_config: JSON.stringify({
                                automationMode: finalData.automationMode,
                                sleepTime: finalData.sleepTime,
                                wakeTime: finalData.wakeTime,
                                currentTemperature: finalData.currentTemperature,
                                comfortTemperature: finalData.comfortTemperature,
                                operator: finalData.operator,
                                conditionValue: finalData.conditionValue,
                            }),
                            device_id: finalData.actionDeviceId,
                            action: JSON.stringify(finalData.action || {}),
                            is_active: 1,
                        })
                        await loadData();

                        // 3. XONG! Bây giờ chỉ cần GỌI BACK() 1 LẦN DUY NHẤT
                        back(); 
                    }
                }
            });
        }, 250);
    };

    const handleOpenEdit = (automation: any) => {
        const triggerConfig = automation.trigger_config ? JSON.parse(automation.trigger_config) : {};
        const actionObj = automation.action ? JSON.parse(automation.action) : {};

        open({
            id: "editAutomationForm",
            title: "Sửa tự động hóa",
            direction: "bottom",
            className: "mt-[8vh]! w-screen bg-background rounded-t-2xl",
            component: CreateAutomation,
            props: {
                devices,
                getDeviceIcon,
                initialData: {
                    name: automation.name,
                    automationMode: triggerConfig.automationMode || "custom",
                    sleepTime: triggerConfig.sleepTime || "22:30",
                    wakeTime: triggerConfig.wakeTime || "06:30",
                    currentTemperature: triggerConfig.currentTemperature || "28",
                    comfortTemperature: triggerConfig.comfortTemperature || "26",
                    operator: triggerConfig.operator || "",
                    conditionValue: triggerConfig.conditionValue || "28",
                    actionDeviceId: automation.device_id,
                    action: actionObj,
                },
                onCancel: back,
                onCreateAutomation: async (finalData: any) => {
                    await automationRepo.update(automation.id, {
                        name: finalData.name || "Tự động hóa",
                        trigger_config: JSON.stringify({
                            automationMode: finalData.automationMode,
                            sleepTime: finalData.sleepTime,
                            wakeTime: finalData.wakeTime,
                            currentTemperature: finalData.currentTemperature,
                            comfortTemperature: finalData.comfortTemperature,
                            operator: finalData.operator,
                            conditionValue: finalData.conditionValue,
                        }),
                        device_id: finalData.actionDeviceId,
                        action: JSON.stringify(finalData.action || {}),
                    });
                    await loadData();
                    back();
                }
            }
        });
    };

    // Màn hình danh sách kịch bản
    return (
        <div className="flex flex-col w-full max-w-xl mx-auto h-full max-h-[75vh] bg-background">
            <div className="flex items-center justify-between px-4 pt-2 pb-1 flex-shrink-0">
                <Button
                    variant="ghost"
                    className="text-foreground hover:text-foreground font-medium p-0 h-auto hover:bg-transparent text-base transition-colors"
                    onClick={() => { setIsEditing(!isEditing); setDeleteConfirmId(null); }}
                >
                    {isEditing ? "Xong" : "Xoá"}
                </Button>
                <Button
                    variant="default"
                    className="bg-foreground text-background hover:bg-foreground/90 gap-1.5 rounded-2xl px-4 h-9 text-sm font-medium"
                    onClick={() => open({
                        id: "sceneTypeSelector",
                        title: "Kịch bản thông minh",
                        direction: "bottom",
                        className: "mt-[8vh]! w-screen bg-background rounded-t-2xl",
                        component: SceneTypeSelector,
                        props: { onSelectAutomation: handleSelectAutomation }
                    })}
                >
                    <HugeiconsIcon icon={AddCircleIcon} size={18} />
                    Thêm kịch bản
                </Button>
            </div>

            {/* Vùng danh sách: Cho phép cuộn (flex-1 overflow-y-auto) */}
            <div className="flex-1 overflow-y-auto px-4 pt-2">
                {/* Thêm pb-6 ở đây để khi cuộn xuống dưới cùng, phần tử cuối không bị dính vào viền */}
                <div className="w-full space-y-3 pb-6">
                    {automations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                                <HugeiconsIcon icon={AddCircleIcon} size={32} className="text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-base">Chưa có kịch bản nào</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Hãy bắt đầu bằng cách tạo kịch bản đầu tiên của bạn.
                                </div>
                            </div>
                            <Button
                                variant="default"
                                className="bg-foreground text-background hover:bg-foreground/90 gap-1.5 rounded-2xl px-6"
                                onClick={() => open({
                                    id: "sceneTypeSelector",
                                    title: "Kịch bản thông minh",
                                    direction: "bottom",
                                    className: "mt-[8vh]! w-screen bg-background rounded-t-2xl",
                                    component: SceneTypeSelector,
                                    props: { onSelectAutomation: handleSelectAutomation }
                                })}
                            >
                                <HugeiconsIcon icon={AddCircleIcon} size={18} />
                                Tạo kịch bản
                            </Button>
                        </div>
                    ) : (
                    automations.map((automation) => {
                        const device = devices.find(d => d.id === automation.device_id);
                        const triggerConfig = automation.trigger_config ? JSON.parse(automation.trigger_config) : {};
                        const actionObj = automation.action ? JSON.parse(automation.action) : {};
                        const conditionLabel = triggerConfig.operator === ">"
                            ? `Nhiệt độ trên ${triggerConfig.conditionValue}°C`
                            : triggerConfig.operator === "<"
                                ? `Nhiệt độ dưới ${triggerConfig.conditionValue}°C`
                                : "Điều kiện chưa đặt";

                        const displayConditionLabel = getAutomationConditionLabel(triggerConfig, conditionLabel);

                        return (
                            <div key={automation.id} className="relative w-full overflow-hidden rounded-3xl border border-border/50 bg-card">
                                
                                {/* 1. Nút Xóa nền đỏ ẩn ở dưới */}
                                <div className={cn(
                                    "absolute right-0 top-0 bottom-0 z-0 flex w-24 items-center justify-end transition-opacity duration-300",
                                    isEditing ? "opacity-100" : "opacity-0"
                                )}>
                                    <Button
                                        variant="destructive"
                                        className="h-full w-full rounded-none rounded-r-3xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            // Gọi hàm xóa trong DB (Giả sử bạn có hàm delete trong automationRepo)
                                            await automationRepo.delete(automation.id); 
                                            setAutomations((prev) => prev.filter((a) => a.id !== automation.id));
                                        }}
                                    >
                                        Xóa
                                    </Button>
                                </div>

                                {/* 2. Nội dung chính trượt sang trái khi bấm Sửa/Xóa */}
                                <div className={cn(
                                    "relative z-10 flex w-full items-center transition-transform duration-300 ease-in-out bg-card", 
                                    isEditing ? "-translate-x-24" : "translate-x-0"
                                )}>
                                    
                                    {/* 3. Phần thông tin thiết bị (Bỏ Card, dùng div) */}
                                    <div 
                                        className="flex-1 min-w-0 p-4 transition-colors duration-200 active:bg-muted/60 cursor-pointer"
                                        onClick={() => handleOpenEdit(automation)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                                                    <HugeiconsIcon icon={getDeviceIcon(device?.type || "")} size={22} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-semibold text-base truncate">{automation.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{device?.name || "Thiết bị"}</div>
                                                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground/80">
                                                        <span className="truncate">{displayConditionLabel}</span>
                                                        {actionObj?.label && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="truncate max-w-[100px]">{actionObj.label}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* 4. Nút Switch (Ẩn đi khi isEditing = true) */}
                                    <div className={cn(
                                        "flex items-center transition-all duration-200 origin-right pr-4 flex-shrink-0",
                                        isEditing ? "opacity-0 scale-50 pointer-events-none hidden" : "opacity-100 scale-100"
                                    )}
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                    onPointerDown={(e) => e.stopPropagation()}>
                                        <Switch
                                            checked={automation.is_active === 1}
                                            onCheckedChange={async (checked) => {
                                                await automationRepo.update(automation.id, { is_active: checked ? 1 : 0 });
                                                setAutomations(prev =>
                                                    prev.map(a => a.id === automation.id ? { ...a, is_active: checked ? 1 : 0 } : a)
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
