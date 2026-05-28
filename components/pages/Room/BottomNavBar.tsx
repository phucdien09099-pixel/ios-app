"use client";
import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { HomeIcon, AddCircleIcon, DeviceAccessIcon, Clock01Icon, SmartPhone01Icon, PlayIcon, Delete02Icon, IcoIcon, ArrowLeft01Icon, } from "@hugeicons/core-free-icons";
import { useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TimerUI } from "./TimerDrawer";
import { usePreventExit } from "@/hooks/usePreventExit";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import CreateSmartSceneDrawer from "./CreateSmartSceneDrawer";

type NavItem = {
    label: string;
    icon: any;
    key: string;
};

const navItems: NavItem[] = [
    {
        key: "controll",
        label: "Feature",
        icon: HomeIcon,
    },
    {
        key: "smart",
        label: "Kịch bản",
        icon: DeviceAccessIcon,
    },
    {
        key: "timer",
        label: "Hẹn giờ",
        icon: AddCircleIcon,
    },
];

export default function BottomNavBar({ deviceId, }: { deviceId: any; }) {
    const { open } = useNavDrawer();
    return (
        <>
            {/* NAVBAR */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md">
                <div className="mx-auto grid max-w-md grid-cols-3 items-center px-2 py-2">
                    {navItems.map((item) => {
                        return (
                            <Button
                                key={item.key}
                                variant="ghost"
                                onClick={() => open({
                                    id: item.key,
                                    title: item.label,
                                    component: BottomDrawer,
                                    props: {
                                        type: item.key
                                    },
                                    renderRightButtonHeader: <></>,
                                    direction: "bottom",
                                    className: "mt-40! h-full! mx-auto rounded-2xl bg-white w-full"
                                })}
                                className={cn(
                                    "flex h-auto w-full flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all duration-200",
                                )}
                            >
                                <HugeiconsIcon
                                    icon={item.icon}
                                    size={22}
                                    className={cn(
                                        "transition-colors",
                                        // isActive
                                        //     ? "text-primary"
                                        //     : "text-muted-foreground"
                                    )}
                                />

                                <span
                                    className={cn(
                                        "text-[11px] leading-none transition-colors",
                                        // isActive
                                        //     ? "font-medium text-primary"
                                        //     : "text-muted-foreground"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </Button>
                        );
                    })}
                </div>
            </div >

            {/* DRAWER */}

        </>
    );
}

function BottomDrawer({ type }: { type: string | null }) {
    if (type === "smart") return <SmartSceneUI />;
    if (type === "timer") return <TimerUI />;
}

function SmartSceneUI() {
    const [showCreateScene, setShowCreateScene] = useState(false);
    const { open } = useNavDrawer();
    usePreventExit(
        showCreateScene,
        () => {
            setShowCreateScene(false);
            return true;
        }
    );

    return (
        <div className="space-y-3 h-full!">
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium">
                            Bật đèn ban đêm
                        </div>

                        <div className="text-sm text-muted-foreground">
                            18:00 → 23:00
                        </div>
                    </div>

                    <Switch defaultChecked />
                </div>

                <div className="mt-3 flex gap-2">
                    <Badge>
                        <HugeiconsIcon icon={SmartPhone01Icon} size={14} />
                        Auto
                    </Badge>

                    <Badge variant="outline">
                        Living Room
                    </Badge>
                </div>
            </Card>

            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium">
                            Tắt toàn bộ thiết bị
                        </div>

                        <div className="text-sm text-muted-foreground">
                            Khi rời khỏi nhà
                        </div>
                    </div>

                    <Switch />
                </div>

                <div className="mt-3 flex gap-2">
                    <Badge variant="secondary">
                        Scene
                    </Badge>
                </div>
            </Card>

            <Button
                className="w-full gap-2"
                onClick={() => open({
                    id: "create",
                    title: "Kịch bản thông minh",
                    component: CreateSmartSceneDrawer,
                    renderRightButtonHeader: <></>,
                    direction: "right",
                    className: "mt-40 h-full! mx-auto rounded-2xl bg-white w-full"
                })}>
                <HugeiconsIcon icon={AddCircleIcon} />
                Thêm kịch bản
            </Button>

        </div>
    );
}
