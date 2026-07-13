import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { triggerSmartWhisper } from "@/libs/whisperUtils";

export let roomDriverObj: any = null;

export function startRoomTour(force = false) { // 🟢 Thêm tham số force
    if (!force && typeof window !== 'undefined' && localStorage.getItem("tour:room") === "1") {
        return;
    }
    
    if (roomDriverObj) roomDriverObj.destroy();
    
    const dynamicSteps: any[] = [
        { element: '[data-tour="scan-hub-qr"]', popover: { title: "Quét QR Hub", description: "Mở camera sau và quét mã QR trên Hub để tự động chọn thiết bị." } },
        { element: '[data-tour="room-name"]', popover: { title: "Tên khu vực", description: "Ví dụ: Phòng khách..." } },
        { element: '[data-tour="room-note"]', popover: { title: "Ghi chú", description: "Thông tin mô tả thêm..." } },
        { element: '[data-tour="wifi-ssid"]', popover: { title: "Tên WiFi", description: "Hub sẽ kết nối vào mạng WiFi này." } },
        { element: '[data-tour="wifi-password"]', popover: { title: "Mật khẩu WiFi", description: "Mật khẩu mạng WiFi 2.4Ghz." } },
        { element: '[data-tour="submit-room"]', popover: { title: 'Hoàn tất', description: 'Nhấn vào đây để lưu phòng.', side: 'top', align: 'start'} }
    ];

    roomDriverObj = driver({
        showProgress: true,
        allowClose: false, 
        nextBtnText: "Tiếp theo",
        prevBtnText: "Bỏ qua", 
        onPrevClick: () => {
            if (typeof window !== 'undefined') {
                localStorage.setItem("tour:room", "1");
                localStorage.setItem("tour:backToHome", "1");
            }
            if (roomDriverObj) roomDriverObj.destroy();
            setTimeout(() => {
                triggerSmartWhisper(true, false);
            }, 300);
        },
        doneBtnText: "Hoàn tất",
        steps: dynamicSteps,
        onDestroyStarted: () => {
            if (typeof window !== 'undefined') localStorage.setItem("tour:room", "1"); 
            if (roomDriverObj) roomDriverObj.destroy();
        }
    });

    roomDriverObj.drive();
}

export const startBackToHomeTour = () => {
    if (typeof window !== 'undefined' && localStorage.getItem("tour:backToHome") === "1") {
        return;
    }
    
    if (roomDriverObj) {
        roomDriverObj.destroy();
    }

    roomDriverObj = driver({
        showProgress: false,
        allowClose: false, 
        steps: [
            {
                element: '[data-tour="drawer-back-button"]', 
                popover: {
                    title: 'Thành công! 🎉',
                    description: 'Phòng đã được tạo. Hãy nhấn vào nút này để quay lại màn hình chính.',
                    side: 'bottom',
                    align: 'start',
                    onPopoverRender: (popover, { config, state }) => {
                        const backBtn = document.querySelector('[data-tour="drawer-back-button"]');
                        if (backBtn) {
                            backBtn.addEventListener('click', () => {
                                if (roomDriverObj) roomDriverObj.destroy();
                            }, { once: true });
                        }
                    }
                }
            }
        ],
        onDestroyStarted: () => {
            if (typeof window !== 'undefined') {
                localStorage.setItem("tour:backToHome", "1");
            }
            if (roomDriverObj) roomDriverObj.destroy();
        }
    });
    
    roomDriverObj.drive();
}

export const showHubNotFoundTour = () => {
    if (roomDriverObj) roomDriverObj.destroy();
    
    const errorDriver = driver({
        showProgress: false,
        allowClose: false, 
        doneBtnText: "Đã hiểu",
        steps: [
            {
                popover: {
                    title: 'Không tìm thấy Hub',
                    description: `
                        <div style="text-align: center; margin-top: 10px;">
                            <img src="/h1.png" style="width: 140px; border-radius: 8px; margin: 0 auto 10px auto; display: block;" />
                            <p style="font-size: 13px; line-height: 1.5;">Hãy chắc chắn Hub đã được cắm điện (sáng đèn như hình) và điện thoại đã bật kết nối Bluetooth nhé!</p>
                        </div>
                    `,
                }
            }
        ]
    });
    errorDriver.drive();
}
