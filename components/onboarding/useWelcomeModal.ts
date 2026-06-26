import { useState, useCallback } from "react";
import { startHomeTour } from "./tours/homeTour";
import { ONBOARDING_KEYS } from "./onboardingKeys";

export function useWelcomeModal() {
    const [showWelcome, setShowWelcome] = useState(false);

    const checkWelcome = useCallback((roomCount: number) => {
        const isWelcomed = localStorage.getItem(ONBOARDING_KEYS.WELCOMED);
        const isHomeDone = localStorage.getItem(ONBOARDING_KEYS.HOME); // 🟢 Lấy thêm trạng thái của Home Tour

        if (roomCount > 0) {
            localStorage.setItem(ONBOARDING_KEYS.WELCOMED, "1");
            localStorage.setItem(ONBOARDING_KEYS.HOME, "1");
            return; 
        }

        if (!isWelcomed) {
            setShowWelcome(true);
        } else if (isHomeDone !== "1") { 
            // 🟢 KẾT HỢP ĐIỀU KIỆN: Chỉ gọi startHomeTour nếu chưa bấm "Để sau"
            startHomeTour();
        }
    }, []);

    const handleStart = () => {
        localStorage.setItem(ONBOARDING_KEYS.WELCOMED, "1");
        setShowWelcome(false);
        // Delay 300ms đợi Modal mờ đi hẳn rồi mới gọi Tour
        setTimeout(() => startHomeTour(), 300);
    };

    const handleSkip = () => {
        localStorage.setItem(ONBOARDING_KEYS.WELCOMED, "1");
        localStorage.setItem(ONBOARDING_KEYS.HOME, "1");
        localStorage.setItem(ONBOARDING_KEYS.ADD_ROOM, "1");
        localStorage.setItem("tour:backToHome", "1"); 
        localStorage.setItem("tour:detail", "1");
        localStorage.setItem("tour:room", "1");
        localStorage.removeItem("JUST_CREATED_ROOM_ID");
        localStorage.removeItem("JUST_ADDED_DEVICE");
        setShowWelcome(false);

    };

    return {
        showWelcome,
        checkWelcome,
        handleStart,
        handleSkip
    };
}
