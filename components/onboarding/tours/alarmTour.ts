import { triggerSmartWhisper } from "@/libs/whisperUtils";
import { driver } from "driver.js";

export let alarmDriverObj: ReturnType<typeof driver> | undefined;

export const startAlarmTour = () => {
    if (alarmDriverObj) alarmDriverObj.destroy();
    sessionStorage.setItem("alarm_tour_active", "true");

    const isInsideForm = document.querySelector('[data-tour="alarm-mode-select"]') !== null;

    if (isInsideForm) {
        // --- KỊCH BẢN 1: BÊN TRONG FORM ---
        alarmDriverObj = driver({
            showProgress: true,
            allowClose: false,
            showButtons: ['next', 'previous'],
            nextBtnText: "Tiếp tục ➔",
            prevBtnText: "Bỏ qua", 
            doneBtnText: "Hoàn tất",
            onPrevClick: () => {
                sessionStorage.removeItem("alarm_tour_active");
                if (alarmDriverObj) alarmDriverObj.destroy();
                setTimeout(() => {
                    triggerSmartWhisper(true, false);
                }, 300);
            },
            onDestroyStarted: () => {
                sessionStorage.removeItem("alarm_tour_active");
                if (alarmDriverObj) alarmDriverObj.destroy();
            },
            steps: [
                { element: '[data-tour="alarm-mode-select"]', popover: { title: "Kiểu chuông", description: "Chọn loại âm thanh bạn muốn báo thức phát ra." } },
                { element: '[data-tour="alarm-volume-slider"]', popover: { title: "Âm lượng", description: "Chỉnh độ lớn của chuông báo thức." } },
                { element: '[data-tour="alarm-test-btn"]', popover: { title: "Phát thử", description: "Nghe thử chuông trực tiếp trên Hub." } },
                { element: '[data-tour="alarm-time-input"]', popover: { title: "Giờ kích hoạt", description: "Chọn thời gian báo thức kêu." } },
                { element: '[data-tour="alarm-duration-toggle"]', popover: { title: "Tự tắt", description: "Thời gian chuông tự động ngắt." } },
                { element: '[data-tour="alarm-days-toggle"]', popover: { title: "Ngày lặp lại", description: "Chọn các ngày trong tuần bạn muốn lặp lại báo thức." } },
                { element: '[data-tour="alarm-save-btn"]', popover: { title: "Lưu lại", description: "Hoàn tất thì nhấn vào đây để lưu nhé.", side: "top" } }
            ]
        });
        alarmDriverObj.drive();

    } else {
        // --- KỊCH BẢN 2: Ở NGOÀI DANH SÁCH ---
        alarmDriverObj = driver({
            showProgress: false,
            allowClose: false,
            showButtons: ['next', 'previous'],
            nextBtnText: "Bắt đầu ngay",
            prevBtnText: "Bỏ qua", 
            onPrevClick: () => {
                sessionStorage.removeItem("alarm_tour_active");
                if (alarmDriverObj) alarmDriverObj.destroy();
            },
            onDestroyStarted: () => {
                sessionStorage.removeItem("alarm_tour_active");
                if (alarmDriverObj) alarmDriverObj.destroy();
            },
            steps: [
                {
                    element: '[data-tour="add-alarm-btn"]',
                    popover: {
                        title: "Tạo báo thức mới",
                        description: "Nhấn vào đây để tiến hành thêm báo thức!",
                        side: "bottom",
                    }
                }
            ]
        });
        
        setTimeout(() => {
            if (alarmDriverObj) alarmDriverObj.drive();
        }, 150);
    }
};