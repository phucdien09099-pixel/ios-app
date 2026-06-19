import { useState, useCallback } from "react";
import { startEmptyRoomTour } from "./tours/emptyRoomTour";

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
        // 1. Lưu cờ đã hỏi Modal này
        localStorage.setItem("tour:welcomed_room", "1");
        
        // 🟢 2. DẬP CẦU DAO TOÀN BỘ CÁC TOUR LIÊN QUAN ĐẾN THIẾT BỊ
        localStorage.setItem("tour:afterAddDevice", "1"); // Chặn tour ngắm thiết bị
        localStorage.setItem("tour:addDevice", "1");      // Chặn tour trong form điền thiết bị
        localStorage.setItem("tour:backToRoom", "1");     // Chặn tour chỉ vào nút Back
        
        // 🟢 3. Xóa luôn cờ này (nếu lỡ có) để chắc chắn không bị dính bàn tay vuốt
        localStorage.removeItem("JUST_ADDED_DEVICE"); 

        setShowWelcomeRoom(false);
    };

    return {
        showWelcomeRoom,
        checkWelcomeRoom,
        handleStartRoom,
        handleSkipRoom
    };
}