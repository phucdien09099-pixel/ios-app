import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export let timerDriverObj: any = null;

const isElementVisibleOnScreen = (selector: string) => {
    const el = document.querySelector(selector);
    if (!el) return false;
    
    const rect = el.getBoundingClientRect();
    return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top < window.innerHeight &&
        rect.bottom > 0
    );
};

export const startTimerTour = (forceInside: boolean = false) => {
    if (timerDriverObj) timerDriverObj.destroy();

    const isFormActuallyVisible = isElementVisibleOnScreen('[data-tour="timer-name"]');
    const isCreateFormOpen = isFormActuallyVisible || forceInside;

    if (isCreateFormOpen) {
        // --- KỊCH BẢN 1: BÊN TRONG FORM ---
        timerDriverObj = driver({
            showProgress: true,
            allowClose: false,
            showButtons: ['next', 'previous'],
            nextBtnText: "Tiếp tục ➔",
            prevBtnText: "Bỏ qua", 
            doneBtnText: "Hoàn tất",
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
            showButtons: ['next', 'previous'],
            nextBtnText: "Bắt đầu ngay",
            prevBtnText: "Bỏ qua", 
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
                    element: '[data-tour="timer-add-btn"]',
                    popover: {
                        title: "Tạo hẹn giờ mới",
                        description: "Nhấn vào đây để tiến hành thêm hẹn giờ!",
                        side: "bottom"
                    }
                }
            ]
        });
        timerDriverObj.drive();
    }
};