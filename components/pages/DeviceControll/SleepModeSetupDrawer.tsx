"use client";

import { useState } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, UserIcon, Baby02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/libs/utils";

// ============================================================================
// Type + constant dùng chung cho toàn bộ Sleep mode (ACsController import từ đây)
// ============================================================================

export type SleepTarget = "child" | "adult" | "elderly";

export type SleepConfig = {
    sleep: boolean;
    wakeTime: string;
    target: SleepTarget | null;
    temperature: number;
    configured: boolean; // true = người dùng đã tự lưu cấu hình, false = chưa từng set (kể cả đã chạy mặc định)
};

export const DEFAULT_SLEEP_CONFIG: SleepConfig = {
    sleep: false,
    wakeTime: "06:30",
    target: null,
    temperature: 25,
    configured: false,
};

function ElderlyIcon({ size = 20 }: { size?: number }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="9.5" cy="4.2" r="2.1" />
            <path d="M9.5 6.4c-1.7.4-2.8 1.9-2.6 3.6l.5 4" />
            <path d="M7.9 12.2c-.5 2.1-.9 4.4-1.4 6.3" />
            <path d="M9.5 12.6c.6 2 .9 4.3 1.3 6.1" />
            <path d="M7.4 10c1 .9 2.1 1.3 3.4 1.1" />
            <path d="M16 7.5v12" />
            <path d="M16 7.5c0-1 .8-1.8 1.8-1.8" />
        </svg>
    );
}

// Nguồn duy nhất cho danh sách đối tượng - label tiếng Anh, gửi thẳng lên payload
export const SLEEP_TARGETS: {
    key: SleepTarget;
    label: string;
    recommendedTemp: number;
    icon: any;
}[] = [
    { key: "child", label: "Child", recommendedTemp: 26, icon: Baby02Icon },
    { key: "adult", label: "Adult", recommendedTemp: 25, icon: UserIcon },
    { key: "elderly", label: "Elderly", recommendedTemp: 27, icon: null }, // dùng ElderlyIcon tự vẽ
];

// Tự sinh từ SLEEP_TARGETS, không cần khai báo lặp lại
export const SLEEP_TARGET_LABEL: Record<SleepTarget, string> = SLEEP_TARGETS.reduce(
    (acc, item) => ({ ...acc, [item.key]: item.label }),
    {} as Record<SleepTarget, string>
);

// ============================================================================
// Drawer 1: thiết lập giờ thức + đối tượng
// ============================================================================

interface SleepModeSetupDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initial: SleepConfig;
    onSave: (values: { wakeTime: string; target: SleepTarget; temperature: number }) => void;
}

export default function SleepModeSetupDrawer({
    open,
    onOpenChange,
    initial,
    onSave,
}: SleepModeSetupDrawerProps) {
    const [wakeTime, setWakeTime] = useState(initial.wakeTime);
    const [target, setTarget] = useState<SleepTarget | null>(initial.target);

    const canSave = Boolean(wakeTime && target);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="w-full bg-background rounded-t-2xl mt-[8vh]! max-h-dvh flex flex-col z-9999 [&>div:first-child]:hidden">
                <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-muted-foreground/20 shrink-0" />

                <DrawerHeader className="text-center sm:text-left pb-2">
                    <DrawerTitle className="text-xl font-bold">
                        Thiết lập chế độ ngủ ngon
                    </DrawerTitle>
                    <DrawerDescription className="text-sm mt-1">
                        Máy lạnh sẽ tự điều chỉnh nhiệt độ theo đối tượng đến giờ thức dậy.
                    </DrawerDescription>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto w-full px-5 pb-8 pt-2 space-y-5">
                    <Field>
                        <FieldLabel htmlFor="sleep-wake-time">Giờ thức dậy</FieldLabel>
                        <div className="relative">
                            <HugeiconsIcon
                                icon={Moon02Icon}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                                id="sleep-wake-time"
                                type="time"
                                className="pl-9"
                                value={wakeTime}
                                onChange={(event) => setWakeTime(event.target.value)}
                            />
                        </div>
                    </Field>

                    <div className="space-y-3">
                        <div className="text-sm font-medium">Đối tượng sử dụng</div>
                        <div className="grid grid-cols-3 gap-3">
                            {SLEEP_TARGETS.map((item) => {
                                const active = target === item.key;
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => setTarget(item.key)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition",
                                            active
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                                            {item.icon ? (
                                                <HugeiconsIcon icon={item.icon} size={20} />
                                            ) : (
                                                <ElderlyIcon />
                                            )}
                                        </div>
                                        <div className="text-xs font-medium leading-tight">
                                            {item.label}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">
                                            {item.recommendedTemp}°C
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Button
                        className="w-full h-12 rounded-2xl"
                        disabled={!canSave}
                        onClick={() => {
                            if (!target) return;
                            const matched = SLEEP_TARGETS.find((item) => item.key === target);
                            if (!matched) return;
                            onSave({ wakeTime, target, temperature: matched.recommendedTemp });
                        }}
                    >
                        Lưu và bật chế độ ngủ ngon
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

// ============================================================================
// Drawer 2: xác nhận chạy cấu hình mặc định khi chưa từng thiết lập
// ============================================================================

interface SleepConfirmDefaultDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    onOpenSetup: () => void;
}

export function SleepConfirmDefaultDrawer({
    open,
    onOpenChange,
    onConfirm,
    onOpenSetup,
}: SleepConfirmDefaultDrawerProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/50"
                onClick={() => onOpenChange(false)}
            />

            <div className="relative w-full max-w-sm rounded-2xl bg-background p-5 shadow-lg">
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                    aria-label="Đóng"
                >
                    <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>

                <h2 className="pr-6 text-lg font-bold">Chưa thiết lập chế độ ngủ ngon</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Bạn chưa cấu hình chế độ này. Nếu tiếp tục, hệ thống sẽ chạy theo cấu
                    hình mặc định (06:30, Adult, 25°C). Bạn có chắc chứ?
                </p>

                <div className="mt-5 flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 h-11 rounded-2xl"
                        onClick={onOpenSetup}
                    >
                        Huỷ, để tôi thiết lập
                    </Button>
                    <Button className="flex-1 h-11 rounded-2xl" onClick={onConfirm}>
                        Đồng ý, chạy mặc định
                    </Button>
                </div>
            </div>
        </div>
    );
}