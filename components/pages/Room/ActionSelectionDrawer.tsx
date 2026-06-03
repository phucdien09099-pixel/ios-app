"use client";

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

interface ActionSelectionDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    device: Device | null;
    currentAction: TimerAction | undefined;
    onSelectAction: (action: TimerAction) => void;
}

export default function ActionSelectionDrawer({ open, onOpenChange, device, currentAction, onSelectAction }: ActionSelectionDrawerProps) {
    if (!device) return null;

    // Tối giản tối đa: Mọi thiết bị (TV, AC, Đèn...) đều chỉ có 2 hành động là BẬT và TẮT
    const availableActions: TimerAction[] = [
        { type: "power", value: "ON", label: `Bật ${device.name.toLowerCase()}` },
        { type: "power", value: "OFF", label: `Tắt ${device.name.toLowerCase()}` }
    ];

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {/* Bo tròn góc trên, giới hạn chiều cao 70% màn hình */}
            <DrawerContent className="w-full bg-background rounded-t-2xl mt-[8vh]! max-h-[100dvh] flex flex-col z-[9999] [&>div:first-child]:hidden">
                
                {/* Thanh gạch ngang nhỏ ở trên cùng để người dùng biết có thể vuốt xuống */}
                <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-muted-foreground/20 flex-shrink-0" />
                
                <DrawerHeader className="text-center sm:text-left pb-2">
                    <DrawerTitle className="text-xl font-bold">Chọn hành động</DrawerTitle>
                    <DrawerDescription className="text-sm mt-1">{device.name}</DrawerDescription>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto w-full px-5 pb-8 pt-2 space-y-3">
                    {/* Render ra đúng 2 nút Bật / Tắt dạng List y như code cũ của bạn */}
                    {availableActions.map((action, index) => {
                        // So sánh xem nút này có đang được chọn hay không
                        const isSelected = action.type === currentAction?.type && action.value === currentAction?.value;

                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => {
                                    // Gửi hành động đã chọn về form
                                    onSelectAction(action);
                                    // Tự động đóng Drawer ngay lập tức sau khi bấm chọn
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
                                
                                {/* Nút tròn checkmark bên phải */}
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