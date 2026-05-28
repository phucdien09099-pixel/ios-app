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

                // Tất cả drawer đều mở, nhưng chỉ có top mới có thể đóng
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
                        dismissible={false}
                        direction={page.direction ?? "right"}
                        key={page.id}
                        open={isOpen}
                        modal={true} >
                        <DrawerContent
                            className={cn(
                                page.className,
                                "before:border-0 before:shadow-none",
                                "before:w-screen! bg-white",
                                "p-0 pt-5! w-screen!" // Tắt padding
                            )}>
                            <DrawerHeader className="relative flex flex-row items-center px-4">

                                {/* LEFT */}
                                <Button
                                    onClick={() =>
                                        handleClose(page.id, isTop)
                                    }
                                    variant="outline"
                                    size="icon"
                                    aria-label="Go Back"
                                    className="shrink-0"
                                >
                                    <HugeiconsIcon icon={ArrowLeftIcon} />
                                </Button>

                                {/* CENTER TITLE */}
                                <DrawerTitle
                                    className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[60%] truncate">
                                    {page.title ?? "Menu"}
                                </DrawerTitle>

                                {/* RIGHT */}
                                <div className="ml-auto flex items-center gap-2 min-w-9 justify-end">
                                    {rightButton}
                                </div>

                            </DrawerHeader>
                            <div className="p-4 pt-2! h-full overflow-auto">
                                <Component {...page.props} />
                            </div>
                        </DrawerContent>
                    </Drawer >
                );
            })}
        </>
    );
}
