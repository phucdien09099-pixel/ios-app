import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export let deviceDriverObj: any = null;

// --- TOUR MÁY LẠNH ---
export function startACTour(force = false) { // 🟢 Thêm force
    if (!force && typeof window !== 'undefined' && localStorage.getItem("tour:ac") === "1") {
        return;
    }
    if (deviceDriverObj) deviceDriverObj.destroy(); // Dọn dẹp tour cũ nếu có

    deviceDriverObj = driver({
        showProgress: true,
        allowClose: false,
        nextBtnText: "Tiếp tục", // Sửa text cho hay
        prevBtnText: "Quay lại", // Đổi thành quay lại
        doneBtnText: "Hoàn tất",
        steps: [
            { element: '[data-tour="ac-power"]', popover: { title: "Bật / Tắt nguồn", description: "Sử dụng nút này để bật hoặc tắt thiết bị máy lạnh.", side: "bottom" } },
            { element: '[data-tour="ac-temp"]', popover: { title: "Điều chỉnh nhiệt độ", description: "Tăng hoặc giảm nhiệt độ phòng bằng hai nút mũi tên hai bên.", side: "bottom" } },
            { element: '[data-tour="ac-mode"]', popover: { title: "Chế độ hoạt động", description: "Lựa chọn chế độ làm mát: Cool (Làm lạnh), Dry (Hút ẩm) hoặc Fan (Quạt gió).", side: "top" } },
            { element: '[data-tour="ac-fan"]', popover: { title: "Tốc độ gió", description: "Thay đổi tốc độ quạt từ cấp độ Auto (Tự động) đến các mức mạnh dần 1, 2, 3.", side: "top" } },
            { element: '[data-tour="ac-quick"]', popover: { title: "Tiện ích nhanh", description: "Điều khiển đảo gió (Swing) hoặc cấu hình hẹn giờ (Timer).", side: "top" } }
        ],
        onDestroyStarted: () => {
            if (typeof window !== 'undefined') localStorage.setItem("tour:ac", "1");
            if (deviceDriverObj) deviceDriverObj.destroy();
        }
    });
    deviceDriverObj.drive();
}

// --- TOUR TIVI ---
export function startTVTour(force = false) { 
    if (!force && typeof window !== 'undefined' && localStorage.getItem("tour:tv") === "1") {
        return;
    }
    if (deviceDriverObj) deviceDriverObj.destroy();

    deviceDriverObj = driver({
        showProgress: true,
        allowClose: false,
        nextBtnText: "Tiếp tục",
        prevBtnText: "Quay lại",
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