import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { triggerSmartWhisper } from "@/libs/whisperUtils";

export let addDeviceDriverObj: any = null;

export function startAddDeviceTour(force = false) {
    // 🟢 KIỂM TRA CỜ "TOUR LIÊN HOÀN" TỪ SESSION STORAGE
    let isChainForced = false;
    if (typeof window !== 'undefined') {
        isChainForced = sessionStorage.getItem("force_tour_add_device") === "1";
    }
    
    // Nếu được ép buộc trực tiếp (force = true) HOẶC đang trong chuỗi tour liên hoàn
    const shouldForce = force || isChainForced;

    if (!shouldForce && typeof window !== 'undefined' && localStorage.getItem("tour:addDevice") === "1") {
        return;
    }

    // 🟢 Xoá cờ ngay lập tức để không bị lặp lại nếu lần sau người dùng tự mở tay
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem("force_tour_add_device");
    }
    
    if (addDeviceDriverObj) addDeviceDriverObj.destroy();

    const dynamicSteps: any[] = [
        {
            element: '[data-tour="device-name"]',
            popover: { title: "Tên thiết bị", description: "Đặt tên cho thiết bị của bạn, ví dụ: Điều hòa phòng khách, Quạt trần..." }
        },
        {
            element: '[data-tour="device-type"]',
            popover: { title: "Phân loại thiết bị", description: "Chọn đúng loại thiết bị của bạn." }
        },
        {
            element: '[data-tour="device-attributes"]',
            popover: { title: "Thông số chi tiết", description: "Tuỳ theo loại kết nối, bạn sẽ chọn Hãng sản xuất (với IR/RF) hoặc Quét mã đồng bộ (với IoT)." }
        },
        {
            element: '[data-tour="device-test-btn"]',
            popover: { title: "Thử nghiệm tín hiệu", description: "Nhấn vào đây để phát thử tín hiệu xem thiết bị có phản hồi không trước khi lưu chính thức nhé." }
        },
        {
            element: '[data-tour="device-save-btn"]',
            popover: { title: "Lưu thiết bị", description: "Cuối cùng, nhấn vào đây để lưu thiết bị vào phòng của bạn. Hoàn tất!", side: "top" }
        }
    ];

    addDeviceDriverObj = driver({
        showProgress: true,
        allowClose: false,
        showButtons: ['next', 'previous'],
        nextBtnText: "Tiếp tục", 
        prevBtnText: "Bỏ qua", 
        doneBtnText: "Hoàn tất",

        onPrevClick: () => {
            if (typeof window !== 'undefined') {
                localStorage.setItem("tour:addDevice", "1");
                localStorage.setItem("tour:backToRoom", "1"); // Bỏ qua phát ngắt luôn tour chỉ nút quay lại phòng
            }
            setTimeout(() => {
                triggerSmartWhisper(true, false);
            }, 300);
            if (addDeviceDriverObj) addDeviceDriverObj.destroy();
        },

        steps: dynamicSteps, 
        onDestroyStarted: () => {
            if (typeof window !== 'undefined') {
                localStorage.setItem("tour:addDevice", "1"); 
            }
            if (addDeviceDriverObj) {
                addDeviceDriverObj.destroy();
            }
        }
    });

    addDeviceDriverObj.drive();
}

export const startBackToRoomTour = () => {
    if (typeof window !== 'undefined' && localStorage.getItem("tour:backToRoom") === "1") {
        return;
    }
    
    if (typeof window !== 'undefined') {
        localStorage.setItem("tour:backToRoom", "1");
        localStorage.setItem("JUST_ADDED_DEVICE", "1");
    }

    const handleHighlightClick = (e: MouseEvent) => {
        if (!e.isTrusted) return; 

        const btn = document.querySelector('[data-tour="drawer-back-button"]');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        if (
            e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom
        ) {
            e.preventDefault();
            e.stopPropagation();
            
            // 1. Gỡ ngay event listener để giải phóng nút
            document.removeEventListener('click', handleHighlightClick, true);
            
            // 2. Tắt cái tour
            if (addDeviceDriverObj) addDeviceDriverObj.destroy();
            
            // 🟢 3. CẮM CỜ ĐỂ TRUYỀN LỆNH CHO TRANG PHÒNG CHẠY TOUR TIẾP THEO
            if (typeof window !== 'undefined') {
                sessionStorage.setItem("trigger_after_add_device", "1");
            }

            // 4. Giờ mới kích hoạt nút back một cách an toàn
            (btn as HTMLElement).click();
        }
    };

    addDeviceDriverObj = driver({
        showProgress: false,
        allowClose: false,

        onPopoverRender: () => {
            document.addEventListener('click', handleHighlightClick, true); 
        },
        
        onDestroyStarted: () => {
            document.removeEventListener('click', handleHighlightClick, true);
            
            if (typeof window !== 'undefined') {
                localStorage.setItem("tour:backToRoom", "1");
            }
            if (addDeviceDriverObj) {
                addDeviceDriverObj.destroy();
            }
        },
        steps: [
            {
                element: '[data-tour="drawer-back-button"]', 
                popover: {
                    title: 'Thành công! 🎉',
                    description: 'Thiết bị đã được thêm. Hãy nhấn vào nút này để quay lại phòng.',
                    side: 'bottom',
                    align: 'start'
                }
            }
        ]
    });
    
    addDeviceDriverObj.drive();
}