import { useState, useCallback } from "react";
import { startEmptyRoomTour } from "./tours/emptyRoomTour";
import { triggerSmartWhisper } from "@/libs/whisperUtils";

export function useWelcomeRoomModal() {
    const [showWelcomeRoom, setShowWelcomeRoom] = useState(false);

    const checkWelcomeRoom = useCallback((deviceCount: number) => {
        const isWelcomed = localStorage.getItem("tour:welcomed_room");

        // Nếu đã có thiết bị -> Ghi đè cờ đã xem để không bao giờ hỏi nữa
        if (deviceCount > 0) {
            localStorage.setItem("tour:welcomed_room", "1");
            return;
        }

        // Nếu phòng trống và CHƯA TỪNG HỎI
        if (!isWelcomed) {
            setShowWelcomeRoom(true); 
        }
    }, []);

    const handleStartRoom = () => {
        localStorage.setItem("tour:welcomed_room", "1");
        setShowWelcomeRoom(false);
        // Chạy hướng dẫn bàn tay
        setTimeout(() => startEmptyRoomTour(), 300);
    };

    const handleSkipRoom = () => {
        localStorage.setItem("tour:welcomed_room", "1");
        localStorage.setItem("tour:afterAddDevice", "1");
        localStorage.setItem("tour:addDevice", "1");
        localStorage.setItem("tour:backToRoom", "1");
        localStorage.removeItem("JUST_ADDED_DEVICE"); 
        document.getElementById("custom-finger-guide")?.remove();
        setShowWelcomeRoom(false);
        setTimeout(() => {
            triggerSmartWhisper(true, false);
        }, 300);
    };

    return {
        showWelcomeRoom,
        checkWelcomeRoom,
        handleStartRoom,
        handleSkipRoom
    };
}
