import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export let timerDriverObj: any = null;

export const startTimerTour = (forceInside = false) => {
    if (timerDriverObj) timerDriverObj.destroy();

    const isCreateFormOpen = document.querySelector('[data-tour="timer-name"]') !== null || forceInside;

    if (isCreateFormOpen) {
        // --- KỊCH BẢN 1: BÊN TRONG FORM ---
        timerDriverObj = driver({
            showProgress: true,
            allowClose: false,
            showButtons: ['next', 'previous'], // 🟢 Bật lại nút bên trái
            nextBtnText: "Tiếp tục ➔",
            prevBtnText: "Bỏ qua", // 🟢 Đổi tên thành Bỏ qua
            doneBtnText: "Hoàn tất",
            // 🟢 THỦ THUẬT: Ép sự kiện click nút Previous thành Hủy Tour
            onPrevClick: () => {
                sessionStorage.removeItem("timer_tour_active");
                if (timerDriverObj) timerDriverObj.destroy();
            },
            onDestroyStarted: () => {
                sessionStorage.removeItem("timer_tour_active");
                if (timerDriverObj) timerDriverObj.destroy();
            },
            steps: [
                { element: '[data-tour="timer-name"]', popover: { title: "Tên hẹn giờ", description: "Đặt tên dễ nhớ, ví dụ: 'Tắt máy lạnh'." } },
                { element: '[data-tour="timer-time"]', popover: { title: "Thời gian", description: "Chọn giờ và phút bạn muốn kích hoạt." } },
                { element: '[data-tour="timer-days"]', popover: { title: "Ngày lặp lại", description: "Chọn các ngày trong tuần. Bỏ trống nếu chỉ chạy 1 lần." } },
                { element: '[data-tour="timer-device"]', popover: { title: "Chọn thiết bị", description: "Bấm vào thiết bị và cấu hình hành động mong muốn." } },
                { element: '[data-tour="timer-save"]', popover: { title: "Lưu lại", description: "Hoàn tất thì nhấn vào đây để lưu nhé.", side: "top" } }
            ]
        });
        timerDriverObj.drive();

    } else {
        // --- KỊCH BẢN 2: Ở NGOÀI DANH SÁCH ---
        timerDriverObj = driver({
            showProgress: false,
            allowClose: false,
            showButtons: ['next', 'previous'], // 🟢 Bật nút trái
            nextBtnText: "Bắt đầu ngay",
            prevBtnText: "Bỏ qua", // 🟢 Đổi tên thành Bỏ qua
            onPrevClick: () => {
                sessionStorage.removeItem("timer_tour_active");
                if (timerDriverObj) timerDriverObj.destroy();
            },
            onDestroyStarted: () => {
                sessionStorage.removeItem("timer_tour_active");
                if (timerDriverObj) timerDriverObj.destroy();
            },
            steps: [
                {
                    popover: {
                        title: "👋 Hướng dẫn Hẹn giờ",
                        description: "Chào mừng bạn! Tính năng này giúp thiết bị tự động bật/tắt theo thời gian. Nhấn nút bên dưới để xem cách làm nhé.",
                    }
                },
                {
                    element: '[data-tour="timer-add-btn"]',
                    popover: {
                        title: "Tạo mới",
                        description: "Hãy tự tay nhấn vào nút này để mở form. Hệ thống sẽ tiếp tục hướng dẫn bạn ở màn hình tiếp theo!",
                        side: "bottom"
                    }
                }
            ]
        });
        timerDriverObj.drive();
    }
};