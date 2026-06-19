"use client";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

type Props = {
    open: boolean;
    roomName: string;
    onStart: () => void;
    onSkip: () => void;
};

export default function WelcomeRoomModal({ open, roomName, onStart, onSkip }: Props) {
    if (!open) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-background border shadow-xl rounded-2xl p-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h3 className="font-semibold text-sm">Chào mừng đến {roomName}! 🎉</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Phòng đang trống. Bạn có muốn xem hướng dẫn thêm thiết bị ngay bây giờ không?
                    </p>
                </div>
                <button onClick={onSkip} className="text-muted-foreground p-1 hover:text-foreground">
                    <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs px-4"
                    onClick={onSkip}
                >
                    Để sau
                </Button>
                <Button
                    size="sm"
                    className="h-8 text-xs px-4"
                    onClick={onStart}
                >
                    Bắt đầu
                </Button>
            </div>
        </div>
    );
}