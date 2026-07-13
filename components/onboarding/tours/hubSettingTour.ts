import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { triggerSmartWhisper } from "@/libs/whisperUtils";

export let hubSettingDriverObj: any = null;

export const startHubSettingTour = (force = false) => {
    if (hubSettingDriverObj) hubSettingDriverObj.destroy();

    const volumeSliderElement = document.querySelector('[data-tour="hub-volume-slider"]') as HTMLElement | null;
    const volumeTabBtn = document.querySelector('[data-tour="hub-tab-volume"]');

    const isSliderVisible = volumeSliderElement !== null && volumeSliderElement.offsetParent !== null;
    const isTabActive = volumeTabBtn?.getAttribute('data-state') === 'active' || volumeTabBtn?.getAttribute('aria-selected') === 'true';

    const isVolumeTabActive = isSliderVisible || isTabActive;

    let dynamicSteps: any[] = [];

    if (isVolumeTabActive) {
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

    hubSettingDriverObj = driver({
        showProgress: true,
        allowClose: false,
        showButtons: ['next', 'previous'], 
        nextBtnText: "Tiếp theo",
        prevBtnText: "Bỏ qua", 
        onPrevClick: () => {
            if (hubSettingDriverObj) hubSettingDriverObj.destroy();
            setTimeout(() => {
                triggerSmartWhisper(true, false);
            }, 300);
        },
        
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