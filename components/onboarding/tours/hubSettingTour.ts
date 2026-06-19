import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export let hubSettingDriverObj: any = null;

export const startHubSettingTour = (force = false) => {
    if (hubSettingDriverObj) hubSettingDriverObj.destroy();

    // 🟢 CÁCH KIỂM TRA BẤT BẠI: 
    // 1. Lấy phần tử thanh trượt âm lượng
    const volumeSliderElement = document.querySelector('[data-tour="hub-volume-slider"]') as HTMLElement | null;
    // 2. Lấy nút Tab âm lượng
    const volumeTabBtn = document.querySelector('[data-tour="hub-tab-volume"]');

    // Kiểm tra xem nội dung âm lượng có đang hiển thị vật lý trên màn hình không (offsetParent !== null)
    const isSliderVisible = volumeSliderElement !== null && volumeSliderElement.offsetParent !== null;
    // Kiểm tra dự phòng xem Tab có đang được chọn không
    const isTabActive = volumeTabBtn?.getAttribute('data-state') === 'active' || volumeTabBtn?.getAttribute('aria-selected') === 'true';

    // Đang ở Tab Âm Lượng nếu 1 trong 2 điều kiện trên là đúng
    const isVolumeTabActive = isSliderVisible || isTabActive;

    let dynamicSteps: any[] = [];

    if (isVolumeTabActive) {
        // --- CHỈ HIỂN THỊ 2 BƯỚC CỦA TAB ÂM LƯỢNG ---
        dynamicSteps = [
            { 
                element: '[data-tour="hub-tab-volume"]', 
                popover: { title: "Tab Âm lượng", description: "Đây là khu vực cài đặt âm lượng thông báo của Hub.", side: "bottom" } 
            },
            { 
                element: '[data-tour="hub-volume-slider"]', 
                popover: { title: "Chỉnh âm lượng", description: "Kéo thanh trượt để tăng/giảm âm lượng cho các thông báo và cảnh báo từ Hub. Đã hoàn tất!", side: "top" } 
            }
        ];
    } else {
        // --- HIỂN THỊ 6 BƯỚC CỦA TAB ĐÈN (MẶC ĐỊNH) ---
        dynamicSteps = [
            { 
                element: '[data-tour="hub-tabs"]', 
                popover: { title: "Chuyển đổi tính năng", description: "Bạn có thể chuyển đổi qua lại giữa cài đặt Đèn LED và Âm lượng thông báo tại đây.", side: "bottom" } 
            },
            { element: '[data-tour="hub-color-wheel"]', popover: { title: "Vòng màu RGB", description: "Vuốt để chọn màu sắc hiển thị trên đèn Hub.", side: "bottom" } },
            { element: '[data-tour="hub-presets"]', popover: { title: "Màu có sẵn", description: "Hoặc chọn nhanh các màu sắc cơ bản tại đây.", side: "top" } },
            { element: '[data-tour="hub-brightness"]', popover: { title: "Độ sáng", description: "Điều chỉnh mức độ sáng tối của đèn LED.", side: "top" } },
            { element: '[data-tour="hub-speed"]', popover: { title: "Tốc độ hiệu ứng", description: "Tăng hoặc giảm tốc độ chuyển động của các hiệu ứng màu.", side: "top" } },
            { element: '[data-tour="hub-mode"]', popover: { title: "Hiệu ứng đèn", description: "Chọn các chế độ nháy, cầu vồng, xoay vòng... cực kỳ đẹp mắt.", side: "top" } }
        ];
    }

    // Khởi chạy tour
    hubSettingDriverObj = driver({
        showProgress: true,
        allowClose: false,
        showButtons: ['next', 'previous'],
        nextBtnText: "Tiếp tục",
        prevBtnText: "Quay lại",
        doneBtnText: "Hoàn tất",
        steps: dynamicSteps,
        onDestroyStarted: () => {
            if (hubSettingDriverObj) {
                hubSettingDriverObj.destroy();
                hubSettingDriverObj = null;
            }
        }
    });

    hubSettingDriverObj.drive();
};