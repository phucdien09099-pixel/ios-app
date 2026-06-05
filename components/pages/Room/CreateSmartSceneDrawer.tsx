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

export default function CreateSmartSceneDrawer({ roomId }: CreateSmartSceneDrawerProps) {
    const { open, back } = useNavDrawer();
    const [devices, setDevices] = useState<Device[]>([]);
    const [automations, setAutomations] = useState<any[]>([]);

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
                                operator: finalData.operator,
                                conditionValue: finalData.conditionValue,
                            }),
                            device_id: finalData.actionDeviceId,
                            action: JSON.stringify(finalData.action || {}),
                            is_active: 1,
                        })
                        await loadData();

                        // 3. XONG! Bây giờ chỉ cần GỌI BACK() 1 LẦN DUY NHẤT
                        // back(); 
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

            {/* Vùng danh sách: Cho phép cuộn (flex-1 overflow-y-auto) */}
            <div className="flex-1 overflow-y-auto px-4 pt-2">
                {/* Thêm pb-6 ở đây để khi cuộn xuống dưới cùng, phần tử cuối không bị dính vào viền */}
                <div className="w-full space-y-3 pb-6">
                    {automations.length === 0 ? (
                        <div className="py-16 text-center text-sm text-muted-foreground">
                            Chưa có kịch bản nào được tạo
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

                        return (
                            <div
                                key={automation.id}
                                className="rounded-3xl border border-border/50 bg-card overflow-hidden"
                                onClick={() => handleOpenEdit(automation)}
                            >
                                <Card className="rounded-none border-none p-4 bg-transparent shadow-none active:bg-muted/60 transition-colors duration-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                                                <HugeiconsIcon icon={getDeviceIcon(device?.type || "")} size={22} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-base truncate">{automation.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{device?.name || "Thiết bị"}</div>
                                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground/80">
                                                    <span className="truncate">{conditionLabel}</span>
                                                    {actionObj?.label && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="truncate max-w-[100px]">{actionObj.label}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Bọc thẻ div có onPointerDown để chặn tuyệt đối việc mở Edit */}
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                            onPointerDown={(e) => e.stopPropagation()}
                                        >
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
                                </Card>
                            </div>
                        );
                    })
                )}
                </div>
            </div>

            <div className="shrink-0 p-3 pb-6 bg-background border-t shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.05)] z-10">
                <Button
                    className="w-full gap-2 rounded-2xl h-11"
                    onClick={() => open({
                        id: "sceneTypeSelector",
                        title: "Kịch bản thông minh",
                        direction: "bottom",
                        className: "mt-[8vh]! w-screen bg-background rounded-t-2xl",
                        component: SceneTypeSelector,
                        props: {
                            onSelectAutomation: handleSelectAutomation,
                        }
                    })}
                >
                    <HugeiconsIcon icon={AddCircleIcon} />
                    Thêm kịch bản
                </Button>
            </div>
        </div>
    );
}
