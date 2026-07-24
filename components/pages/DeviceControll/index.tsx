"use client";
import { Device } from "../Room/DeviceCard";
import ACsController from "./ACsController";
import SmartSchedule from "./SmartSchedule";
import { SmartSwitchController } from "./SmartSwitchController";
import TVsController from "./TVsController";
import LightsController from "./LightsController";
import LearningRemoteController from "./LearningRemoteController";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, DeviceAccessIcon } from "@hugeicons/core-free-icons";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { TimerUI } from "../Room/TimerDrawer";
import CreateSmartSceneDrawer from "../Room/CreateSmartSceneDrawer";
import HelpButton from "@/components/common/HelpButton";
import { startTimerTour } from "@/components/onboarding/tours/timerTour";
import { startAutomationTour } from "@/components/onboarding/tours/automationTour";


export default function DeviceControll({ device, roomName }: { roomName: string, device: Device }) {
    const { open } = useNavDrawer();
    const roomId = (device as any).room_id;

    const openDeviceTimer = () => {
        if (!roomId) return;

        open({
            id: `${device.id}-timer`,
            title: `Hẹn giờ - ${device.name}`,
            direction: "bottom",
            className: "mt-[8vh]! w-screen bg-background rounded-t-2xl",
            component: TimerUI,
            renderHelpButtonHeader: <HelpButton onClick={() => startTimerTour()} />,
            props: {
                roomId,
                targetDevice: device as any,
            },
        });
    };

    const openDeviceAutomation = () => {
        if (!roomId) return;

        open({
            id: `${device.id}-automation`,
            title: `Kịch bản - ${device.name}`,
            direction: "bottom",
            className: "mt-[8vh]! w-screen bg-background rounded-t-2xl",
            component: CreateSmartSceneDrawer,
            renderHelpButtonHeader: <HelpButton onClick={() => startAutomationTour()} />,
            props: {
                roomId,
                targetDevice: device as any,
            },
        });
    };

    const renderController = () => {
        switch (device.type) {
            case "TV":
                return <TVsController data={device} />;
            case "RELAY":
                return <SmartSwitchController data={device} />;
            case "SMART_SCHEDULE":
                return <SmartSchedule />;
            case "LIGHT":
                return <LightsController data={device} />;
            case "LEARNING_REMOTE":
                return <LearningRemoteController data={device} roomName={roomName} />;
            default:
                return <ACsController data={device} roomName={roomName} />;
        }
    };

    return (
        <div className="relative min-h-full pb-24">
            {renderController()}

            <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
                <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        className="h-11 rounded-2xl shadow-sm"
                        disabled={!roomId}
                        onClick={openDeviceAutomation}
                    >
                        <HugeiconsIcon icon={DeviceAccessIcon} data-icon="inline-start" />
                        Kịch bản
                    </Button>
                    <Button
                        variant="outline"
                        className="h-11 rounded-2xl shadow-sm"
                        disabled={!roomId}
                        onClick={openDeviceTimer}
                    >
                        <HugeiconsIcon icon={Clock01Icon} data-icon="inline-start" />
                        Hẹn giờ
                    </Button>
                </div>
            </div>
        </div>
    );
}
