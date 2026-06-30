"use client"
import { Room } from "@/db/types/room";
import DeviceCard from "./DeviceCard";
import { EmptyDevices } from "./EmptyDevice";
import AppPullToRefresh from "@/components/common/AppPull2Refresh";
import { useEffect, useState } from "react";
import { deviceRepo } from "@/db/repository/DeviceRepository";
import { Device } from "@/db/types/devive";
import BottomNavBar from "./BottomNavBar";
import { startAfterAddDeviceTour } from "@/components/onboarding/tours/afterAddDeviceTour";
import PullDownGuide from "@/components/onboarding/PullDownGuide";

// 🟢 TÍCH HỢP HOOK VÀ MODAL TỪ BƯỚC TRƯỚC VÀO ĐÂY
import WelcomeRoomModal from "@/components/onboarding/WelcomeRoomModal";
import { useWelcomeRoomModal } from "@/components/onboarding/useWelcomeRoomModal";
import { Badge } from "@/components/ui/badge";

export default function DevicesRoom({ roomId, onLoad, roomName }: { roomName: string, roomId: string, onLoad?: () => Promise<void> }) {
    const [devices, setDevice] = useState<Device[]>();
    const [showGuide, setShowGuide] = useState(false);

    // Lấy trạng thái của Modal
    const { showWelcomeRoom, checkWelcomeRoom, handleStartRoom, handleSkipRoom } = useWelcomeRoomModal();

    const load = async (isManual = false) => {
        const data = await deviceRepo.getByRoom(roomId);
        setDevice(data);
        await onLoad?.();

        // 🟢 CHẠY KIỂM TRA ĐỂ HIỆN MODAL HỎI ĐÁP
        checkWelcomeRoom(data.length);

        if (isManual) {
            setShowGuide(false);
            if (localStorage.getItem("JUST_ADDED_DEVICE")) {
                localStorage.removeItem("JUST_ADDED_DEVICE");
                if (localStorage.getItem("tour:afterAddDevice") !== "1" && data.length > 0) {
                    setTimeout(() => {
                        startAfterAddDeviceTour();
                    }, 600);
                }
            }
        }

        if (!isManual && data.length > 0 && localStorage.getItem("JUST_ADDED_DEVICE")) {
            localStorage.removeItem("JUST_ADDED_DEVICE");
            setShowGuide(false);

            if (localStorage.getItem("tour:afterAddDevice") !== "1") {
                setTimeout(() => {
                    startAfterAddDeviceTour();
                }, 600);
            }
        }

        if (data.length > 0 && localStorage.getItem("tour:afterAddDevice") === "1") {
            localStorage.removeItem("JUST_ADDED_DEVICE");
            setShowGuide(false);
        }

        return data;
    }

    useEffect(() => {
        void load(false);

        const checkTargetCreated = (currentDevices: Device[] = []) => {
            const justAddedDevice = localStorage.getItem("JUST_ADDED_DEVICE");

            const isSkipped = localStorage.getItem("tour:afterAddDevice") === "1";

            if (!justAddedDevice || isSkipped || currentDevices.length > 0) {
                if (isSkipped || currentDevices.length > 0) {
                    localStorage.removeItem("JUST_ADDED_DEVICE");
                }
                setShowGuide(false);
                return;
            }

            if (justAddedDevice && !isSkipped) {
                setShowGuide(true);
            }
        };

        const handleDeviceChanged = async () => {
            const data = await load(false);
            checkTargetCreated(data);
        };

        window.addEventListener("drawer-closed", handleDeviceChanged);
        window.addEventListener("device-created", handleDeviceChanged);

        return () => {
            window.removeEventListener("drawer-closed", handleDeviceChanged);
            window.removeEventListener("device-created", handleDeviceChanged);
        };
    }, []);

    return (
        <>
            <div className="mx-4 mt-4 rounded-3xl border bg-gradient-to-br from-card via-card to-muted/50 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">Room control</p>
                        <h2 className="truncate text-2xl font-semibold tracking-tight">{roomName}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Quản lý thiết bị và kéo xuống để làm mới trạng thái.
                        </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 rounded-full">
                        {devices?.length ?? 0} thiết bị
                    </Badge>
                </div>
            </div>

            <AppPullToRefresh
                className="min-h-[calc(40dvh-13rem)]"
                onRefresh={async () => {
                    await load(true);
                }}
            >
                {devices && devices.length > 0
                    ? (
                        <>
                            <div className="m-4 grid grid-cols-1 gap-4 pb-24 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                                {devices.map((d) => (
                                    <DeviceCard
                                        roomName={roomName}
                                        onDeleted={async () => {
                                            await load(false);
                                        }}
                                        key={d.id}
                                        device={d as any}
                                    />
                                ))}
                            </div>
                        </>
                    )
                    : (<EmptyDevices roomId={roomId} roomName={roomName} />)
                }
            </AppPullToRefresh >

            {showGuide && <PullDownGuide type="device" />}
            <BottomNavBar roomId={roomId} />

            {/* 🟢 GẮN MODAL XUỐNG DƯỚI CÙNG GIAO DIỆN */}
            <WelcomeRoomModal
                open={showWelcomeRoom}
                roomName={roomName}
                onStart={handleStartRoom}
                onSkip={handleSkipRoom}
            />
        </>
    )
}
