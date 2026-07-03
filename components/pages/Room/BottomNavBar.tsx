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
import { UpCommingFeature } from "@/components/upcomming-feature";
import { startTimerTour } from "@/components/onboarding/tours/timerTour";
import HelpButton from "@/components/common/HelpButton";
import { startAutomationTour } from "@/components/onboarding/tours/automationTour";


type NavItem = {
    label: string;
    icon: any;
    key: string;
};

const navItems: NavItem[] = [
    // {
    //     key: "feature",
    //     label: "Feature",
    //     icon: HomeIcon,
    // },
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

export default function BottomNavBar({ roomId, }: { roomId: any; }) {
    const { open } = useNavDrawer();
    return (
        <>
            {/* NAVBAR */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md">
                <div className="mx-auto grid max-w-md grid-cols-2 items-center px-2 py-2">
                    {navItems.map((item) => {
                        return (
                            <Button
                                key={item.key}
                                data-tour={`nav-${item.key}`}
                                variant="ghost"
                                onClick={() => open({
                                    id: item.key,
                                    title: item.label,
                                    component: BottomDrawer,
                                    props: {
                                        type: item.key,
                                        roomId: roomId
                                    },
                                    renderHelpButtonHeader: item.key === "timer"
                                    ? <HelpButton onClick={() => startTimerTour(true)} />
                                    : item.key === "smart"
                                    ? <HelpButton onClick={() => startAutomationTour(true)} />
                                    : <></>,
                                    direction: "bottom",
                                    className: "mt-[8vh]! w-screen bg-background rounded-t-2xl"
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
                                    )}
                                />

                                <span
                                    className={cn(
                                        "text-[11px] leading-none transition-colors",
                                    )}
                                >
                                    {item.label}
                                </span>
                            </Button>
                        );
                    })}
                </div>
            </div >
        </>
    );
}

function BottomDrawer({ type, roomId }: { type: string | null; roomId: string }) {
    if (type === "smart") return <CreateSmartSceneDrawer roomId={roomId} />;
    else if (type === "timer") return <TimerUI roomId={roomId} />;
    else return <UpCommingFeature />;
}

function SmartSceneUI({ roomId }: { roomId: string }) {
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
                    renderHelpButtonHeader: <HelpButton onClick={() => startTimerTour(false)} />,
                    direction: 'bottom',
                    className: 'mt-[8vh]! w-screen bg-background rounded-t-2xl',
                    props: { roomId }
                })}>
                <HugeiconsIcon icon={AddCircleIcon} />
                Thêm kịch bản
            </Button>

        </div>
    );
}
