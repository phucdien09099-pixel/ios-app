"use client";

import { useState } from "react";
import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { usePreventExit } from "@/hooks/usePreventExit";
import { cn } from "@/libs/utils";
import { useDrawer } from "./DrawerProvider";

export function NestedDrawers() {
    const [closingId, setClosingId] = useState<string | null>(null);
    const { stack, pop } = useDrawer();

    const handleClose = (pageId: string, isTop: boolean) => {
        if (!isTop) return;

        setClosingId(pageId);
        requestAnimationFrame(() => {
            setTimeout(() => {
                pop();
                setClosingId(null);
                window.dispatchEvent(new CustomEvent("drawer-closed", { detail: { pageId } }));
            }, 220);
        });
    };

    usePreventExit(stack.length > 0, () => {
        const current = stack[stack.length - 1];
        if (!current) return false;

        handleClose(current.id, true);
        return true;
    });

    return (
        <>
            {stack.map((page, index) => {
                const isTop = index === stack.length - 1;
                const isClosing = closingId === page.id;
                const Component = page.component;

                if (!Component) {
                    console.error("Drawer component missing:", page);
                    return null;
                }

                return (
                    <Drawer
                        scrollLockTimeout={9999999999}
                        autoFocus
                        noBodyStyles
                        dismissible={page.direction === "bottom"}
                        direction={page.direction ?? "right"}
                        key={page.id}
                        open={!isClosing}
                        onOpenChange={(open) => {
                            if (!open && page.direction === "bottom") {
                                setTimeout(() => {
                                    pop();
                                    window.dispatchEvent(new CustomEvent("drawer-closed", { detail: { pageId: page.id } }));
                                }, 300);
                            }
                        }}
                        modal
                    >
                        <DrawerContent
                            className={cn(
                                page.className,
                                "before:border-0 before:shadow-none",
                                "before:w-screen! bg-background",
                                "flex max-h-screen w-screen! flex-col p-0 pt-0!",
                                page.direction === "bottom" && "[&>div:first-child]:hidden"
                            )}
                        >
                            {page.direction === "bottom" && (
                                <div className="mx-auto mt-3 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20" />
                            )}

                            <DrawerHeader
                                className={cn(
                                    "flex flex-col gap-2 px-4 pb-2",
                                    page.direction !== "bottom" && "pt-[max(env(safe-area-inset-top),2rem)]"
                                )}
                            >
                                <div className="relative flex items-center">
                                    <Button
                                        data-tour={isTop ? "drawer-back-button" : undefined}
                                        onClick={() => handleClose(page.id, isTop)}
                                        variant={page.direction === "bottom" ? "ghost" : "outline"}
                                        size="icon"
                                        aria-label="Go Back"
                                        className="size-10! shrink-0 rounded-2xl!"
                                    >
                                        <HugeiconsIcon icon={ArrowLeftIcon} />
                                    </Button>

                                    <DrawerTitle className="pointer-events-none absolute left-1/2 max-w-[70%] -translate-x-1/2 truncate text-center">
                                        {page.title ?? "Menu"}
                                    </DrawerTitle>

                                    {page.renderHelpButtonHeader && (
                                        <div className="ml-auto flex items-center justify-end">
                                            {page.renderHelpButtonHeader}
                                        </div>
                                    )}
                                </div>

                                {page.renderRightButtonHeader && (
                                    <div className="flex min-h-10 flex-wrap items-center justify-start gap-2">
                                        {page.renderRightButtonHeader}
                                    </div>
                                )}
                            </DrawerHeader>

                            <div
                                className={cn(
                                    "flex-1 overflow-auto",
                                    page.direction !== "bottom" && "p-4 pt-2!"
                                )}
                                style={{ touchAction: "auto" }}
                                onPointerDownCapture={(event) => {
                                    const target = event.target as HTMLElement;
                                    if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) {
                                        event.stopPropagation();
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
