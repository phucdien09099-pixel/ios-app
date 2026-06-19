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

export default function DevicesRoom({ roomId, onLoad, roomName }: { roomName: string, roomId: string, onLoad: any }) {
    const [devices, setDevice] = useState<Device[]>();
    const [showGuide, setShowGuide] = useState(false);

    // Lấy trạng thái của Modal
    const { showWelcomeRoom, checkWelcomeRoom, handleStartRoom, handleSkipRoom } = useWelcomeRoomModal();

    const load = async (isManual = false) => {
        const data = await deviceRepo.getByRoom(roomId);
        setDevice(data);

        // 🟢 CHẠY KIỂM TRA ĐỂ HIỆN MODAL HỎI ĐÁP
        checkWelcomeRoom(data.length);

        if (isManual) {
            setShowGuide(false); 
            if (localStorage.getItem("JUST_ADDED_DEVICE")) {
                localStorage.removeItem("JUST_ADDED_DEVICE");
                setTimeout(() => {
                    startAfterAddDeviceTour(); 
                }, 600);
            }
        }
    }

    useEffect(() => {
        load(false); 

        const checkTargetCreated = () => {
            const justAddedDevice = localStorage.getItem("JUST_ADDED_DEVICE");
            
            // 🟢 LẤY CỜ ĐỂ KIỂM TRA XEM ĐÃ BẤM "ĐỂ SAU" CHƯA
            const isSkipped = localStorage.getItem("tour:afterAddDevice") === "1";
            
            // 🟢 CHỈ HIỆN BÀN TAY NẾU CHƯA SKIP
            if (justAddedDevice && !isSkipped) {
                setShowGuide(true);
            }
        };

        window.addEventListener("drawer-closed", checkTargetCreated);

        return () => {
            window.removeEventListener("drawer-closed", checkTargetCreated);
        };
    }, []);

    return (
        <>
            <AppPullToRefresh onRefresh={() => load(true)}>
                {devices && devices.length > 0
                    ? (
                        <>
                            <div className="m-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 pb-24">
                                {devices.map((d) => (
                                    <DeviceCard roomName={roomName} onDeleted={load} key={d.id} device={d as any} />
                                ))}
                            </div>
                            <BottomNavBar roomId={roomId} />
                        </>
                    )
                    : (<EmptyDevices roomId={roomId} roomName={roomName} />)
                }
            </AppPullToRefresh >

            {showGuide && <PullDownGuide type="device" />}

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