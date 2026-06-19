import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export let automationDriverObj: any = null;

export const startAutomationTour = (forceInside = false) => {
    if (automationDriverObj) automationDriverObj.destroy();

    // Nhận diện màn hình hiện tại
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
            },
            onDestroyStarted: () => {
                sessionStorage.removeItem("automation_tour_active");
                if (automationDriverObj) automationDriverObj.destroy();
            },
            steps: [
                { element: '[data-tour="scene-name"]', popover: { title: "Tên kịch bản", description: "Đặt tên dễ nhớ, ví dụ: 'Tự bật điều hòa khi nóng'." } },
                { element: '[data-tour="scene-condition"]', popover: { title: "Điều kiện (Nếu...)", description: "Thiết lập thời gian hoặc nhiệt độ để kích hoạt." } },
                { element: '[data-tour="scene-action"]', popover: { title: "Hành động (Thì...)", description: "Chọn thiết bị và hành động tương ứng." } },
                { element: '[data-tour="scene-save"]', popover: { title: "Lưu lại", description: "Sau khi cấu hình xong, hãy lưu kịch bản nhé!", side: "top" } }
            ]
        });
        automationDriverObj.drive();

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
                    popover: {
                        title: "🤖 Hướng dẫn Kịch bản",
                        description: "Kịch bản (Smart Scene) giúp thiết bị tự động làm việc theo điều kiện cài đặt sẵn.",
                    }
                },
                {
                    element: '[data-tour="scene-add-btn"]',
                    popover: {
                        title: "Tạo mới",
                        description: "Nhấn vào nút Thêm kịch bản để bắt đầu. Hệ thống sẽ tiếp tục hướng dẫn ở bước sau!",
                        side: "bottom"
                    }
                }
            ]
        });
        automationDriverObj.drive();
    }
};