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
import { useTransport } from "@/components/providers/transport/TransportProvider";
import { roomRepo } from "@/db/repository/RoomRepository";
import { Room } from "@/db/types/room";
import HelpButton from "@/components/common/HelpButton";
import { startAutomationTour } from "@/components/onboarding/tours/automationTour";
import { toast } from "sonner";

interface CreateSmartSceneDrawerProps {
    roomId: string;
}

const buildEsp32TaskPayload = (finalData: any, existingId?: string) => {
    const isSleepMode = finalData.automationMode === "sleep";

    return {
        id: existingId || `task_${Math.floor(Date.now() / 1000)}`,
        time: isSleepMode ? finalData.sleepTime : (finalData.time || "22:00"),
        endTime: isSleepMode ? finalData.wakeTime : (finalData.endTime || "06:00"),
        repeat: finalData.repeat ?? true,
        days: [],
        deviceName: finalData.deviceName, // Thường ID từ Form/Select là String, ép sang số nguyên (Number) giống mẫu của bạn
        actions: [
            {
                type: isSleepMode ? "autoTemp" : (finalData.type || "autoTemp"),
                value: finalData.action?.value || "ON",
                temp: Number(finalData.comfortTemperature ?? finalData.conditionValue ?? 26)
            }
        ]
    };
};


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
    const [room, setRoom] = useState<Room | null>();
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const { send } = useTransport();

    const getDeviceIcon = (type: string) => IcoIcon;

    const sendAutomationPayload = async (payload: any, action: "set" | "delete" = "set") => {
        if (!room?.name) {
            toast.warning("Đã lưu kịch bản, nhưng chưa có thông tin Hub để gửi xuống thiết bị.");
            return false;
        }

        try {
            await send(payload, `device/${room.name}/auto/${action}`);
            return true;
        } catch (error) {
            console.warn("Không thể gửi kịch bản xuống thiết bị:", error);
            toast.warning("Đã lưu kịch bản. Thiết bị đang offline nên chưa gửi xuống Hub.");
            return false;
        }
    };

    const loadData = async () => {
        if (!roomId) return;

        // Sử dụng Destructuring để hứng thêm kết quả từ roomRepo
        const [roomDevices, roomAutomations, roomInfo] = await Promise.all([
            deviceRepo.getByRoom(roomId),
            automationRepo.getByRoom(roomId),
            roomRepo.getById(roomId), // 🔥 Thêm lệnh gọi repo lấy thông tin Room ở đây
        ]);

        // console.log("Devices:", roomDevices);
        // console.log("Room Info:", roomInfo);

        // Cập nhật các State
        setDevices(roomDevices);
        setAutomations(roomAutomations);
        setRoom(roomInfo); // 🔥 Mở comment và set dữ liệu vào state
    };

    useEffect(() => {
        loadData();
    }, [roomId]);

    const handleSelectAutomation = async () => {
        // 1. Đóng cái Menu "Chọn kịch bản" lại luôn
        

        // 2. Chờ 0.25s cho Menu trượt xuống mượt mà, rồi đẩy Form lên thay thế
        setTimeout(() => {
            open({
                id: "createAutomationForm",
                title: "Tạo tự động hóa",
                direction: "bottom",
                className: "mt-[8vh]! w-screen bg-background rounded-t-2xl",
                component: CreateAutomation,
                renderHelpButtonHeader: <HelpButton onClick={() => startAutomationTour(true)} />,
                props: {
                    roomName: room?.name,
                    devices,
                    getDeviceIcon,
                    onCancel: back,
                    onCreateAutomation: async (finalData: any) => {
                        // Gọi hàm đóng gói payload
                        const triggerConfigObj = buildEsp32TaskPayload(finalData);
                        console.log(triggerConfigObj)
                        await automationRepo.createAutomation({
                            room_id: roomId,
                            name: finalData.name || "Tự động hóa thông minh",
                            trigger_config: JSON.stringify(triggerConfigObj),
                            deviceId: finalData.deviceId,
                            action: JSON.stringify(finalData.action || { value: "ON" }),
                            is_active: 1,
                        });

                        await sendAutomationPayload(triggerConfigObj, "set");

                        await loadData();
                        await back();
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
                    actionDeviceId: automation.deviceId,
                    action: actionObj,
                },
                onCancel: back,
                onCreateAutomation: async (finalData: any) => {
                    // Tái sử dụng hàm đóng gói, truyền thêm ID cũ để cập nhật ghi đè
                    const triggerConfigObj = buildEsp32TaskPayload(finalData, triggerConfig.id);

                    await automationRepo.update(automation.id, {
                        name: finalData.name || "Tự động hóa",
                        trigger_config: JSON.stringify(triggerConfigObj),
                        deviceId: finalData.actionDeviceId,
                        action: JSON.stringify(finalData.action || { value: "ON" }),
                    });

                    await sendAutomationPayload(triggerConfigObj, "set");
                    await loadData();
                    back();
                }
            }
        });
    };

    // Màn hình danh sách kịch bản
    return (
        <div className="mx-auto flex min-h-full w-full max-w-xl flex-col bg-background pb-24">
            <div className="flex items-center justify-between px-4 pt-2 pb-1 shrink-0">
                <Button
                    variant="ghost"
                    className="text-foreground hover:text-foreground font-medium p-0 h-auto hover:bg-transparent text-base transition-colors"
                    onClick={() => { setIsEditing(!isEditing); setDeleteConfirmId(null); }}
                >
                    {isEditing ? "Xong" : "Xoá"}
                </Button>
                <Button
                    data-tour="scene-add-btn" // 🟢 Thêm Data Tour
                    variant="default"
                    className="bg-foreground text-background hover:bg-foreground/90 gap-1.5 rounded-2xl px-4 h-9 text-sm font-medium relative z-[60]" // 🟢 Thêm relative z-[60]
                    onClick={() => {
                        // 🟢 NỐI CẦU 1: Bấm thêm thì lưu cờ
                        const isTourRunning = document.querySelector('.driver-active-element') !== null;
                        if (isTourRunning) {
                            sessionStorage.setItem("automation_tour_active", "true");
                            import('@/components/onboarding/tours/automationTour').then(m => m.automationDriverObj?.destroy());
                        }

                        open({
                            id: "sceneTypeSelector",
                            title: "Kịch bản thông minh",
                            direction: "bottom",
                            className: "mt-[8vh]! w-screen bg-background rounded-t-2xl",
                            component: SceneTypeSelector,
                            // 🟢 NÚT ? CHO MÀN HÌNH TIẾP THEO
                            renderHelpButtonHeader: <HelpButton onClick={() => startAutomationTour(true)} />,
                            props: { onSelectAutomation: handleSelectAutomation }
                        })
                    }}
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
                                <HugeiconsIcon onClick={() => open({
                                    id: "sceneTypeSelector",
                                    title: "Kịch bản thông minh",
                                    direction: "bottom",
                                    className: "mt-[8vh]! w-screen bg-background rounded-t-2xl",
                                    component: SceneTypeSelector,
                                    props: { onSelectAutomation: handleSelectAutomation }
                                })} icon={AddCircleIcon} size={32} className="text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-base">Chưa có kịch bản nào</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Hãy bắt đầu bằng cách tạo kịch bản đầu tiên của bạn.
                                </div>
                            </div>
                            {/* <Button
                                variant="default"
                                className="bg-foreground text-background hover:bg-foreground/90 gap-1.5 rounded-2xl px-6"
                                onClick={ }
                            >
                                <HugeiconsIcon icon={AddCircleIcon} size={18} />
                                Tạo kịch bản
                            </Button> */}
                        </div>
                    ) : (
                        automations.map((automation) => {
                            const device = devices.find(d => d.id === automation.deviceId);
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
                                                await automationRepo.deleteAutomation(automation.id);
                                                await sendAutomationPayload({ id: automation.id }, "delete");
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
                                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
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
                                                                    <span className="truncate max-w-25">{actionObj.label}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4. Nút Switch (Ẩn đi khi isEditing = true) */}
                                        <div className={cn(
                                            "flex items-center transition-all duration-200 origin-right pr-4 shrink-0",
                                            isEditing ? "opacity-0 scale-50 pointer-events-none hidden" : "opacity-100 scale-100"
                                        )}
                                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                            onPointerDown={(e) => e.stopPropagation()}>
                                            <Switch
                                                checked={automation.is_active === 1}
                                                onCheckedChange={async (checked) => {
                                                    await automationRepo.update(automation.id, { is_active: checked ? 1 : 0 });
                                                    const triggerConfig = automation.trigger_config ? JSON.parse(automation.trigger_config) : {};
                                                    await sendAutomationPayload({ ...triggerConfig, id: triggerConfig.id ?? automation.id }, checked ? "set" : "delete");
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
