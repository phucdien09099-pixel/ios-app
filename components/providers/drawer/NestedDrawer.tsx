"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { usePreventExit } from "@/hooks/usePreventExit";
import { cn } from "@/libs/utils";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import { useDrawer } from "./DrawerProvider";

export function NestedDrawers() {
    const [closingId, setClosingId] = useState<string | null>(null);
    const [disconnectWarning, setDisconnectWarning] = useState<{ label: string } | null>(null);
    const [mounted, setMounted] = useState(false);
    const { stack, pop, reset } = useDrawer();
    const { deviceStates } = useTransport();
    const watchedOnlineRef = useRef<boolean | null>(null);
    const watchedKeyRef = useRef("");

    const watchedConnection = useMemo(() => {
        const page = [...stack].reverse().find((item) => item.monitorConnection);
        return page?.monitorConnection ?? null;
    }, [stack]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const watchedConnectionKey = useMemo(() => {
        if (!watchedConnection) return "";
        return [
            watchedConnection.id,
            watchedConnection.name,
            ...(watchedConnection.fallbackIds ?? []),
        ].filter(Boolean).join("|");
    }, [watchedConnection]);

    const watchedConnectionOnline = useMemo(() => {
        if (!watchedConnection) return null;

        const ids = [
            watchedConnection.id,
            watchedConnection.name,
            ...(watchedConnection.fallbackIds ?? []),
        ].filter((value): value is string => Boolean(value));

        if (ids.length === 0) return null;
        return ids.some((id) => deviceStates[id]?.isOnline === true);
    }, [deviceStates, watchedConnection]);

    useEffect(() => {
        if (!watchedConnection || !watchedConnectionKey) {
            watchedOnlineRef.current = null;
            watchedKeyRef.current = "";
            return;
        }

        if (watchedKeyRef.current !== watchedConnectionKey) {
            watchedKeyRef.current = watchedConnectionKey;
            watchedOnlineRef.current = watchedConnectionOnline;
            return;
        }

        const wasOnline = watchedOnlineRef.current;
        watchedOnlineRef.current = watchedConnectionOnline;

        if (wasOnline === true && watchedConnectionOnline === false && !disconnectWarning) {
            setDisconnectWarning({
                label: watchedConnection.label || watchedConnection.name || watchedConnection.id || "thiết bị",
            });
        }
    }, [disconnectWarning, watchedConnection, watchedConnectionKey, watchedConnectionOnline]);

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

    const handleConfirmDisconnect = () => {
        watchedOnlineRef.current = null;
        watchedKeyRef.current = "";
        setDisconnectWarning(null);
        setClosingId(null);
        reset();
        window.dispatchEvent(new CustomEvent("drawer-closed", { detail: { pageId: "connection-lost" } }));

        requestAnimationFrame(() => reset());
        setTimeout(() => reset(), 80);
    };

    usePreventExit(stack.length > 0, () => {
        const current = stack[stack.length - 1];
        if (!current) return false;

        handleClose(current.id, true);
        return true;
    });

    return (
        <>
            {mounted && disconnectWarning && createPortal(
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black/70 px-6 backdrop-blur-[2px]"
                    style={{
                        zIndex: 2147483647,
                        pointerEvents: "auto",
                        touchAction: "none",
                    }}
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="connection-lost-title"
                    aria-describedby="connection-lost-description"
                    onPointerDown={(event) => {
                        event.stopPropagation();
                    }}
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                >
                    <div
                        className="w-full max-w-[300px] rounded-[24px] bg-white p-5 text-gray-900 shadow-2xl"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="text-center">
                            <h2 id="connection-lost-title" className="text-[17px] font-semibold">
                                Mất kết nối thiết bị
                            </h2>
                            <p id="connection-lost-description" className="mt-2 text-[13px] leading-relaxed text-gray-500">
                                {disconnectWarning.label || "Thiết bị"} hiện không còn phản hồi. Vui lòng kiểm tra nguồn, Internet hoặc Bluetooth rồi thử lại.
                            </p>
                        </div>

                        <Button
                            type="button"
                            className="mt-5 h-10 w-full rounded-full bg-gray-900 text-white hover:bg-gray-800"
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleConfirmDisconnect();
                            }}
                        >
                            OK
                        </Button>
                    </div>
                </div>,
                document.body
            )}

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
