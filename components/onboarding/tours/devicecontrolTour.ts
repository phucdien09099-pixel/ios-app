import { driver } from "driver.js";
import "driver.js/dist/driver.css";
// 🟢 1. IMPORT HÀM GỌI WHISPER
import { triggerSmartWhisper } from "@/libs/whisperUtils";

export let deviceDriverObj: any = null;

let savedACStepIndex = 0;
let isACTourPausedForDrawer = false;
let resumeACTimeoutId: NodeJS.Timeout | null = null;

// --- TOUR MÁY LẠNH ---
export function startACTour(force = false, startIndex = 0) { 
    if (isACTourPausedForDrawer) {
        return;
    }
    if (!force && startIndex === 0 && typeof window !== 'undefined' && localStorage.getItem("tour:ac") === "1") {
        return;
    }
    if (deviceDriverObj) deviceDriverObj.destroy();

    deviceDriverObj = driver({
        showProgress: true,
        allowClose: false,
        nextBtnText: "Tiếp theo", // Đồng bộ text
        
        // 🟢 2. Sửa thành Bỏ qua và thêm hàm onPrevClick
        prevBtnText: "Bỏ qua", 
        onPrevClick: () => {
            if (typeof window !== 'undefined') localStorage.setItem("tour:ac", "1");
            if (deviceDriverObj) deviceDriverObj.destroy();
            setTimeout(() => {
                triggerSmartWhisper(true, false);
            }, 300);
        },

        doneBtnText: "Hoàn tất",
        steps: [
            { element: '[data-tour="ac-power"]', popover: { title: "Bật / Tắt nguồn", description: "Sử dụng nút này để bật hoặc tắt thiết bị máy lạnh.", side: "bottom" } },
            { element: '[data-tour="ac-temp"]', popover: { title: "Điều chỉnh nhiệt độ", description: "Tăng hoặc giảm nhiệt độ phòng bằng hai nút mũi tên hai bên. Bên dưới còn hiển thị trạng thái Hướng quạt và Tốc độ quạt hiện tại.", side: "bottom" } },
            { element: '[data-tour="ac-mode"]', popover: { title: "Chế độ hoạt động", description: "Lựa chọn 1 trong 5 chế độ: Tự động, Làm mát, Sưởi ấm, Hút ẩm hoặc Quạt gió.", side: "top" } },
            { element: '[data-tour="ac-quick"]', popover: { title: "Hướng quạt & Tốc độ quạt", description: "Nhấn để chuyển đổi lần lượt qua từng mức Hướng quạt hoặc Tốc độ quạt.", side: "top" } },
            { element: '[data-tour="ac-sleep"]', popover: { title: "Chế độ Ngủ ngon", description: "Bật để máy lạnh tự điều chỉnh nhiệt độ theo giờ thức dậy và đối tượng sử dụng. Nhấn vào đây để tự thiết lập.", side: "top" } },
            { element: '[data-tour="nav-smart"]', popover: { title: "Kịch bản thông minh", description: "Thiết lập tự động hóa cho thiết bị này.", side: "top" } },
            { element: '[data-tour="nav-timer"]', popover: { title: "Hẹn giờ", description: "Cài đặt thời gian tự động bật/tắt dễ dàng.", side: "top" } }
        ],
        onDestroyStarted: () => {
            if (!isACTourPausedForDrawer && typeof window !== 'undefined') {
                if (deviceDriverObj && !deviceDriverObj.hasNextStep()) {
                    localStorage.setItem("tour:ac", "1");
                }
            }
            if (deviceDriverObj) deviceDriverObj.destroy();
        }
    });
    deviceDriverObj.drive(startIndex);
}

export const pauseACTourForDrawer = () => {
    // Nếu cả tour object lẫn timer resume đều không tồn tại -> thật sự không có gì để pause
    if (!deviceDriverObj && !resumeACTimeoutId) return;

    isACTourPausedForDrawer = true;

    if (resumeACTimeoutId) {
        clearTimeout(resumeACTimeoutId);
        resumeACTimeoutId = null;
    }

    if (deviceDriverObj) {
        const currentIndex = deviceDriverObj.getActiveIndex();
        if (currentIndex !== undefined) {
            savedACStepIndex = currentIndex;
        }
        deviceDriverObj.destroy();
        deviceDriverObj = null;
    }

    if (typeof document !== 'undefined') {
        document.querySelectorAll('.driver-popover, .driver-overlay, .driver-js-shadow').forEach(el => el.remove());
        document.querySelectorAll('.driver-active-element').forEach(el => el.classList.remove('driver-active-element'));
    }
};

export const resumeACTourAfterDrawer = () => {
    if (!isACTourPausedForDrawer) return;

    isACTourPausedForDrawer = false;

    if (resumeACTimeoutId) clearTimeout(resumeACTimeoutId);

    resumeACTimeoutId = setTimeout(() => {
        resumeACTimeoutId = null;
        if (!isACTourPausedForDrawer) {
            startACTour(true, savedACStepIndex + 1);
        }
    }, 400);
};

// --- TOUR TIVI ---
export function startTVTour(force = false) { 
    if (!force && typeof window !== 'undefined' && localStorage.getItem("tour:tv") === "1") {
        return;
    }
    if (deviceDriverObj) deviceDriverObj.destroy();

    deviceDriverObj = driver({
        showProgress: true,
        allowClose: false,
        nextBtnText: "Tiếp theo", // Đồng bộ text
        
        // 🟢 3. Sửa thành Bỏ qua và thêm hàm onPrevClick tương tự
        prevBtnText: "Bỏ qua",
        onPrevClick: () => {
            if (typeof window !== 'undefined') localStorage.setItem("tour:tv", "1");
            if (deviceDriverObj) deviceDriverObj.destroy();
            setTimeout(() => {
                triggerSmartWhisper(true, false);
            }, 300);
        },

        doneBtnText: "Hoàn tất",
        steps: [
            { element: '[data-tour="tv-power"]', popover: { title: "Bật / Tắt Tivi", description: "Nhấn vào đây để mở hoặc tắt nguồn Tivi của bạn.", side: "bottom" } },
            { element: '[data-tour="tv-channel"]', popover: { title: "Điều chỉnh kênh", description: "Chuyển đổi linh hoạt giữa các kênh truyền hình lên hoặc xuống.", side: "bottom" } },
            { element: '[data-tour="tv-volume"]', popover: { title: "Điều chỉnh âm lượng", description: "Tăng, giảm âm lượng một cách dễ dàng.", side: "bottom" } },
            { element: '[data-tour="tv-navigation"]', popover: { title: "Cụm phím điều hướng", description: "Sử dụng các phím mũi tên để di chuyển trong menu hệ thống và nút OK để xác nhận.", side: "top" } },
            { element: '[data-tour="tv-quick"]', popover: { title: "Các phím tắt nhanh", description: "Bao gồm quay về trang chủ (Home), Tạm dừng phim (Play/Pause), mở cài đặt nhanh (Settings) và Tắt âm lượng (Mute).", side: "top" } }
        ],
        onDestroyStarted: () => {
            if (typeof window !== 'undefined') localStorage.setItem("tour:tv", "1");
            if (deviceDriverObj) deviceDriverObj.destroy();
        }
    });
    deviceDriverObj.drive();
}