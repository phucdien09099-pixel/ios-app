"use client";

import { useEffect, useState } from "react";
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

export default function ActionSelectionDrawer({ open, onOpenChange, device, currentAction, onSelectAction }: ActionSelectionDrawerProps) {
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

    if (!device) return null;

    const isLearningRemote = String(device.type) === "LEARNING_REMOTE";
    const deviceTypeKey = String(device.type ?? "").toLowerCase();

    const availableActions: TimerAction[] = isLearningRemote
        ? remoteButtons.map((button) => ({
            deviceType: ["learning_remote"],
            type: "LEARNING_REMOTE",
            value: button.code_key,
            label: `Gửi nút ${button.name}`,
            command: "SEND",
            key: button.code_key,
            name: button.name,
            remoteButtonId: button.id,
        }))
        : [
            { deviceType: ["all"], type: "power", value: "ON", label: `Bật ${device.name.toLowerCase()}` },
            { deviceType: ["all"], type: "power", value: "OFF", label: `Tắt ${device.name.toLowerCase()}` },
            { deviceType: ["ac"], type: "autoTemp", value: "autoTemp", label: "Tự động tăng/giảm nhiệt độ" },
        ];

    const visibleActions = availableActions.filter(
        (action) => action.deviceType.includes("all") || action.deviceType.includes(deviceTypeKey ?? "")
    );

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
