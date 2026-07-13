import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { triggerSmartWhisper } from "@/libs/whisperUtils";

export let automationDriverObj: any = null;

export const startAutomationTour = (forceInside = false, startIndex = 0) => {
    if (automationDriverObj) automationDriverObj.destroy();
    
    const isFormOpen = document.querySelector('[data-tour="scene-name"]') !== null;
    const isSelectorOpen = document.querySelector('[data-tour="scene-type-auto"]') !== null;

    if (isFormOpen || (forceInside && !isSelectorOpen)) {
        // --- KỊCH BẢN 3: TRONG FORM CẤU HÌNH ---
        automationDriverObj = driver({
            showProgress: true,
            allowClose: false,
            showButtons: ['next', 'previous'],
            nextBtnText: "Tiếp tục ➔",
            prevBtnText: "Bỏ qua",
            doneBtnText: "Hoàn tất",
            onPrevClick: () => {
                sessionStorage.removeItem("automation_tour_active");
                if (automationDriverObj) automationDriverObj.destroy();
                setTimeout(() => {
                    triggerSmartWhisper(true, false);
                }, 300);
            },
            onDestroyStarted: () => {
                sessionStorage.removeItem("automation_tour_active");
                if (automationDriverObj) automationDriverObj.destroy();
            },
            steps: [
                { element: '[data-tour="scene-name"]', popover: { title: "Tên kịch bản và chọn chức năng", description: "Đặt tên dễ nhớ, và chọn loại chức năng" } },
                { element: '[data-tour="scene-condition"]', popover: { title: "Điều kiện (Nếu...)", description: "Thiết lập thời gian hoặc nhiệt độ để kích hoạt." } },
                { element: '[data-tour="scene-action"]', popover: { title: "Hành động (Thì...)", description: "Chọn thiết bị và hành động tương ứng." } },
                { element: '[data-tour="scene-save"]', popover: { title: "Lưu lại", description: "Sau khi cấu hình xong, hãy lưu kịch bản nhé!", side: "top" } }
            ]
        });
        automationDriverObj.drive(startIndex);
    } else if (isSelectorOpen) {
        // --- KỊCH BẢN 2: MÀN HÌNH CHỌN LOẠI KỊCH BẢN ---
        automationDriverObj = driver({
            showProgress: false,
            allowClose: false,
            showButtons: ['next', 'previous'],
            nextBtnText: "Tiếp tục ➔",
            prevBtnText: "Bỏ qua",
            onPrevClick: () => {
                sessionStorage.removeItem("automation_tour_active");
                if (automationDriverObj) automationDriverObj.destroy();
            },
            onDestroyStarted: () => {
                sessionStorage.removeItem("automation_tour_active");
                if (automationDriverObj) automationDriverObj.destroy();
            },
            steps: [
                {
                    element: '[data-tour="scene-type-auto"]',
                    popover: { 
                        title: "Chọn Loại Kịch bản", 
                        description: "Hệ thống đang hỗ trợ Kịch bản Tự động. Hãy nhấn vào đây để tiếp tục.",
                        side: "bottom" 
                    }
                }
            ]
        });
        automationDriverObj.drive();

    } else {
        // --- KỊCH BẢN 1: NGOÀI DANH SÁCH ---
        automationDriverObj = driver({
            showProgress: false,
            allowClose: false,
            showButtons: ['next', 'previous'],
            nextBtnText: "Bắt đầu ngay",
            prevBtnText: "Bỏ qua",
            onPrevClick: () => {
                sessionStorage.removeItem("automation_tour_active");
                if (automationDriverObj) automationDriverObj.destroy();
            },
            onDestroyStarted: () => {
                sessionStorage.removeItem("automation_tour_active");
                if (automationDriverObj) automationDriverObj.destroy();
            },
            steps: [
                {
                    element: '[data-tour="scene-add-btn"]',
                    popover: {
                        title: "Tạo kịch bản mới",
                        description: "Nhấn vào đây để tiến hành thêm kịch bản!",
                        side: "bottom",
                    }
                }
            ]
        });
        automationDriverObj.drive();
    }
};
let savedStepIndex = 0;

export const pauseTourForDrawer = () => {
    if (automationDriverObj) {
        const currentIndex = automationDriverObj.getActiveIndex();
        if (currentIndex !== undefined) {
            savedStepIndex = currentIndex;
        }
        automationDriverObj.destroy();
    }
};

export const resumeTourAfterDrawer = () => {
    startAutomationTour(true, savedStepIndex + 1); 
};