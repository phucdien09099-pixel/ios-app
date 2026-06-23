"use client";

import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, } from "@/components/ui/drawer";
import { useDrawer } from "./DrawerProvider";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePreventExit } from "@/hooks/usePreventExit";

export function NestedDrawers({ rightButton }: { rightButton: React.ReactNode }) {
    const [closingId, setClosingId] = useState<string | null>(null);
    const { stack, pop } = useDrawer();

    const handleClose = (
        pageId: string,
        isTop: boolean
    ) => {
        if (!isTop) return;

        setClosingId(pageId);

        requestAnimationFrame(() => {
            setTimeout(() => {
                pop();
                setClosingId(null);
                window.dispatchEvent(new Event("drawer-closed"));
            }, 220);
        });
    };
    // HANDLE PHONE BACK BUTTON
    usePreventExit(stack.length > 0, () => {
        const current =
            stack[stack.length - 1];

        if (!current) return false;

        handleClose(current.id, true);

        return true;
    });

    return (
        <>
            {stack.map((page, index) => {
                const isTop = index === stack.length - 1;
                const isClosing = closingId === page.id;

                const isOpen = !isClosing;
                const Component = page.component;

                if (!Component) {
                    console.error("Drawer component missing:", page);
                    return null;
                }
                return (
                    <Drawer
                        scrollLockTimeout={9999999999}
                        autoFocus={true}
                        noBodyStyles={true}
                        dismissible={page.direction === "bottom"}
                        direction={page.direction ?? "right"}
                        key={page.id}
                        open={isOpen}
                        onOpenChange={(open) => {
                            if (!open && page.direction === "bottom") {
                                setTimeout(() => pop(), 300);
                            }
                        }}
                        modal={true}
                    >
                        <DrawerContent
                            className={cn(
                                page.className,
                                "before:border-0 before:shadow-none",
                                "before:w-screen! bg-white",
                                "p-0 pt-0! w-screen! flex flex-col max-h-screen",
                                page.direction === "bottom" && "[&>div:first-child]:hidden"
                            )}>

                            {page.direction === "bottom" ? (
                                <>
                                    <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-muted-foreground/20 flex-shrink-0" />
                                    <DrawerHeader className="relative flex flex-row items-center px-4">
                                        <Button
                                            data-tour={isTop ? "drawer-back-button" : undefined}
                                            onClick={() => handleClose(page.id, isTop)}
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Go Back"
                                            className="shrink-0"
                                        >
                                            <HugeiconsIcon icon={ArrowLeftIcon} />
                                        </Button>
                                        <DrawerTitle className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[60%] truncate">
                                            {page.title ?? "Menu"}
                                        </DrawerTitle>
                                        <div className="ml-auto flex items-center gap-2 min-w-9 justify-end z-[60]">
                                            {/* 🟢 Ưu tiên render nút từ page (nếu có), nếu không mới dùng rightButton mặc định */}
                                            {(page as any).renderRightButtonHeader || rightButton}
                                        </div>
                                    </DrawerHeader>
                                </>
                            ) : (
                                <DrawerHeader className="relative flex flex-row items-center px-4 pt-[max(env(safe-area-inset-top),2rem)] pb-2">
                                    <Button
                                        data-tour={isTop ? "drawer-back-button" : undefined}
                                        onClick={() => handleClose(page.id, isTop)}
                                        variant="outline"
                                        size="icon"
                                        aria-label="Go Back"
                                        className="shrink-0"
                                    >
                                        <HugeiconsIcon icon={ArrowLeftIcon} />
                                    </Button>
                                    <DrawerTitle className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[60%] truncate">
                                        {page.title ?? "Menu"}
                                    </DrawerTitle>
                                    <div className="ml-auto flex items-center gap-2 min-w-9 justify-end">
                                        {rightButton}
                                    </div>
                                </DrawerHeader>
                            )}

                            <div
                                className={cn(
                                    "flex-1 overflow-auto",
                                    page.direction !== "bottom" ? "p-4 pt-2!" : ""
                                )}
                                style={{ touchAction: "auto" }}
                                onPointerDownCapture={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
                                        e.stopPropagation();
                                    }
                                }}
                            >
                                <Component {...page.props} />
                            </div>
                        </DrawerContent>
                    </Drawer>
                );
            })}
        </>
    );
}
