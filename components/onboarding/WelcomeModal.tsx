"use client";

import { Button } from "@/components/ui/button";

type Props = {
    open: boolean;
    onStart: () => void;
    onSkip: () => void;
};

export default function WelcomeModal({
    open,
    onStart,
    onSkip,
}: Props) {

    if (!open) return null;

    return (
        <div
            className="
                fixed
                top-4
                left-1/2
                -translate-x-1/2
                z-[9999]
                w-[90%]
                max-w-sm
            "
        >
            <div
                className="
                    rounded-2xl
                    border
                    bg-background
                    shadow-xl
                    p-4
                "
            >
                <h3 className="font-semibold text-sm">
                    Chào mừng đến với Setechsol 👋
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                    Hãy tạo phòng đầu tiên để bắt đầu sử dụng.
                </p>

                <p className="text-sm text-muted-foreground">
                    Bạn có muốn bắt đầu ngay bây giờ không?
                </p>

                <div className="flex justify-end gap-2 mt-4">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onSkip}
                    >
                        Để sau
                    </Button>

                    <Button
                        size="sm"
                        onClick={onStart}
                    >
                        Bắt đầu
                    </Button>
                </div>
            </div>
        </div>
    );
}