"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/libs/utils";
import { Device } from "@/db/types/devive";
import { TimerAction } from "./CreateTimer";
import { deviceRemoteButtonsRepository } from "@/db/repository/DeviceRemoteButtonsRepository";

type StoredRemoteButton = {
    id: string;
    name: string;
    code_key: string;
    learned: number | boolean;
};

interface ActionSelectionDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    device: Device | null;
    currentAction: TimerAction | undefined;
    onSelectAction: (action: TimerAction) => void;
}

const normalizeDeviceType = (type?: string | null) => String(type ?? "").toLowerCase();

export default function ActionSelectionDrawer({
    open,
    onOpenChange,
    device,
    currentAction,
    onSelectAction,
}: ActionSelectionDrawerProps) {
    const [remoteButtons, setRemoteButtons] = useState<StoredRemoteButton[]>([]);
    const [isLoadingRemoteButtons, setIsLoadingRemoteButtons] = useState(false);

    useEffect(() => {
        const deviceId = device?.id;

        if (!open || String(device?.type) !== "LEARNING_REMOTE" || !deviceId) {
            setRemoteButtons([]);
            return;
        }

        let mounted = true;
        setIsLoadingRemoteButtons(true);

        deviceRemoteButtonsRepository
            .getByDeviceId(deviceId)
            .then((buttons) => {
                if (!mounted) return;
                setRemoteButtons(
                    (buttons as StoredRemoteButton[]).filter((button) => button.learned === 1 || button.learned === true)
                );
            })
            .catch((error) => {
                console.error("Could not load learned remote buttons:", error);
                if (mounted) setRemoteButtons([]);
            })
            .finally(() => {
                if (mounted) setIsLoadingRemoteButtons(false);
            });

        return () => {
            mounted = false;
        };
    }, [device, open]);

    const visibleActions = useMemo<TimerAction[]>(() => {
        if (!device) return [];

        const deviceTypeKey = normalizeDeviceType(device.type);

        if (String(device.type) === "LEARNING_REMOTE") {
            return remoteButtons.map((button) => ({
                deviceType: ["learning_remote"],
                type: "LEARNING_REMOTE",
                value: button.code_key,
                label: `Gửi nút ${button.name}`,
                command: "SEND",
                key: button.code_key,
                name: button.name,
                remoteButtonId: button.id,
            }));
        }

        const deviceActionMap: Record<string, TimerAction[]> = {
            ac: [
                // { deviceType: ["ac"], type: "power", value: "ON", label: `Bật ${device.name}` },
                // { deviceType: ["ac"], type: "power", value: "OFF", label: `Tắt ${device.name}` },
                { deviceType: ["ac"], type: "autoTemp", value: "autoTemp", label: "Tự động tăng/giảm nhiệt độ" },
                { deviceType: ["ac"], type: "temp", value: 26, label: "Đặt 26°C" },
                { deviceType: ["ac"], type: "mode", value: "COOL", label: "Chế độ Cool" },
                { deviceType: ["ac"], type: "fan", value: 0, label: "Quạt Auto" },
            ],
            // tv: [
            //     { deviceType: ["tv"], type: "power", value: "ON", label: `Bật ${device.name}` },
            //     { deviceType: ["tv"], type: "power", value: "OFF", label: `Tắt ${device.name}` },
            //     { deviceType: ["tv"], type: "channel", value: "UP", label: "Chuyển kênh +" },
            //     { deviceType: ["tv"], type: "channel", value: "DOWN", label: "Chuyển kênh -" },
            //     { deviceType: ["tv"], type: "volume", value: "UP", label: "Tăng âm lượng" },
            //     { deviceType: ["tv"], type: "volume", value: "DOWN", label: "Giảm âm lượng" },
            //     { deviceType: ["tv"], type: "command", value: "HOME", label: "Home" },
            //     { deviceType: ["tv"], type: "command", value: "OK", label: "OK" },
            //     { deviceType: ["tv"], type: "command", value: "UP", label: "Đi lên" },
            //     { deviceType: ["tv"], type: "command", value: "DOWN", label: "Đi xuống" },
            //     { deviceType: ["tv"], type: "command", value: "LEFT", label: "Qua trái" },
            //     { deviceType: ["tv"], type: "command", value: "RIGHT", label: "Qua phải" },
            //     { deviceType: ["tv"], type: "command", value: "PLAY", label: "Play" },
            //     { deviceType: ["tv"], type: "command", value: "PAUSE", label: "Pause" },
            //     { deviceType: ["tv"], type: "command", value: "MUTE", label: "Mute" },
            //     { deviceType: ["tv"], type: "command", value: "SETTINGS", label: "Settings" },
            // ],
            // light: [
            //     { deviceType: ["light"], type: "power", value: "ON", label: `Bật ${device.name}` },
            //     { deviceType: ["light"], type: "power", value: "OFF", label: `Tắt ${device.name}` },
            //     { deviceType: ["light"], type: "brightness", value: 80, label: "Độ sáng 80%" },
            //     { deviceType: ["light"], type: "color", value: "WARM", label: "Màu vàng ấm" },
            //     { deviceType: ["light"], type: "color", value: "NEUTRAL", label: "Màu trung tính" },
            //     { deviceType: ["light"], type: "color", value: "COOL", label: "Màu trắng sáng" },
            // ],
            // relay: [
            //     { deviceType: ["relay"], type: "power", value: "ON", label: `Bật ${device.name}` },
            //     { deviceType: ["relay"], type: "power", value: "OFF", label: `Tắt ${device.name}` },
            // ],
            // switch: [
            //     { deviceType: ["switch"], type: "power", value: "ON", label: `Bật ${device.name}` },
            //     { deviceType: ["switch"], type: "power", value: "OFF", label: `Tắt ${device.name}` },
            // ],
        };

        return deviceActionMap[deviceTypeKey] ?? [
            { deviceType: [deviceTypeKey], type: "power", value: "ON", label: `Bật ${device.name}` },
            { deviceType: [deviceTypeKey], type: "power", value: "OFF", label: `Tắt ${device.name}` },
        ];
    }, [device, remoteButtons]);

    if (!device) return null;

    const isLearningRemote = String(device.type) === "LEARNING_REMOTE";

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="w-full bg-background rounded-t-2xl mt-[8vh]! max-h-dvh flex flex-col z-9999 [&>div:first-child]:hidden">
                <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-muted-foreground/20 shrink-0" />

                <DrawerHeader className="text-center sm:text-left pb-2">
                    <DrawerTitle className="text-xl font-bold">Chọn hành động</DrawerTitle>
                    <DrawerDescription className="text-sm mt-1">{device.name}</DrawerDescription>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto w-full px-5 pb-8 pt-2 space-y-3">
                    {isLearningRemote && isLoadingRemoteButtons ? (
                        <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                            Đang tải các nút đã học...
                        </div>
                    ) : null}

                    {!isLoadingRemoteButtons && visibleActions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                            {isLearningRemote
                                ? "Remote này chưa có nút nào đã học. Hãy học nút trong màn hình điều khiển remote trước."
                                : "Thiết bị này chưa có hành động hẹn giờ phù hợp."}
                        </div>
                    ) : null}

                    {visibleActions.map((action, index) => {
                        const isSelected = action.type === currentAction?.type && action.value === currentAction?.value;

                        return (
                            <button
                                key={`${action.type}-${String(action.value)}-${index}`}
                                type="button"
                                onClick={() => {
                                    onSelectAction(action);
                                    onOpenChange(false);
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between rounded-2xl border p-4 transition-all duration-200 text-left",
                                    isSelected
                                        ? "border-primary bg-primary/5 text-primary font-medium ring-1 ring-primary/20"
                                        : "border-border/60 bg-card text-foreground hover:bg-muted/40"
                                )}
                            >
                                <div>
                                    <div className="font-semibold text-base">{action.label}</div>
                                    <div className="text-xs text-muted-foreground mt-1 opacity-80 uppercase tracking-wider">
                                        Lệnh: {action.type} ({String(action.value)})
                                    </div>
                                </div>

                                <div className={cn(
                                    "size-5 rounded-full border flex items-center justify-center transition-all",
                                    isSelected ? "border-primary text-primary" : "border-muted-foreground/30"
                                )}>
                                    {isSelected && <div className="size-2.5 rounded-full bg-primary" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
