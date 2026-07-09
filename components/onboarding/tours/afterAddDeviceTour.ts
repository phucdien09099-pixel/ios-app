import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { startEmptyRoomTour } from "./emptyRoomTour"; 

export let afterAddDeviceDriverObj: any = null;

export const startAfterAddDeviceTour = (force = false) => {
    // 🟢 1. KIỂM TRA CỜ TỪ NÚT BACK CHUYỂN SANG
    let isChainForced = false;
    if (typeof window !== 'undefined') {
        isChainForced = sessionStorage.getItem("trigger_after_add_device") === "1";
    }
    
    const shouldForce = force || isChainForced;

    if (!shouldForce && typeof window !== 'undefined' && localStorage.getItem("tour:afterAddDevice") === "1") {
        return;
    }

    // 🟢 2. CHẶN ĐỨNG NẾU ĐANG Ở TRANG THÊM THIẾT BỊ
    // Nếu tìm thấy nút "Lưu thiết bị", nghĩa là drawer/page thêm thiết bị vẫn đang mở -> Không được chạy tour này!
    if (document.querySelector('[data-tour="device-save-btn"]')) {
        console.warn("Vẫn đang ở trang thêm thiết bị, chặn afterAddDeviceTour!");
        return;
    }

    // Xoá cờ ngay để không bị lặp
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem("trigger_after_add_device");
    }

    if (afterAddDeviceDriverObj) afterAddDeviceDriverObj.destroy();

    // Tăng setTimeout lên 300ms để đợi animation đóng trang Thêm thiết bị hoàn tất
    setTimeout(() => {
        const hasDevice = document.querySelector('[data-tour^="device-card-"]') !== null;

        // ==========================================
        // 🟢 NGỮ CẢNH A: PHÒNG TRỐNG
        // ==========================================
        if (!hasDevice) {
            startEmptyRoomTour(force);
            return;
        }

        // ==========================================
        // 🟢 NGỮ CẢNH B: ĐÃ CÓ THIẾT BỊ
        // ==========================================
        let dynamicSteps: any[] = [
            { element: '[data-tour^="device-card-"]', popover: { title: "Thiết bị của bạn đây!", description: "Trạng thái Online/Offline trực tiếp trên thẻ.", side: "bottom", align: "center" } },
            { element: '[data-tour="device-control-btn"]', popover: { title: "Bảng điều khiển", description: "Nhấn vào đây để bật/tắt.", side: "top", align: "center" } },
            { element: '[data-tour="device-delete-btn"]', popover: { title: "Xóa thiết bị", description: "Nếu không dùng nữa, bạn có thể xóa thiết bị nhanh bằng nút này.", side: "left", align: "center" } },
            { element: '[data-tour="alarm-settings-btn"]', popover: { title: "Báo thức", description: "Thiết lập các mốc thời gian báo thức cho phòng tại đây.", side: "left", align: "center" } },
            { element: '[data-tour="detail-btn-inside"]', popover: { title: "Cài đặt nâng cao", description: "Mở bảng cài đặt và tinh chỉnh đèn/thiết bị cho phòng này.", side: "left", align: "center" } },
            { element: '[data-tour="nav-smart"]', popover: { title: "Kịch bản thông minh", description: "Thiết lập tự động hóa.", side: "top", align: "center" } },
            { element: '[data-tour="nav-timer"]', popover: { title: "Hẹn giờ", description: "Cài đặt thời gian tự động bật/tắt dễ dàng.", side: "top", align: "center" } },
            {
                element: '[data-tour="device-control-btn"]',
                popover: {
                    title: "Khám phá ngay! 🚀",
                    description: "Bây giờ, hãy tự mình nhấn vào đây để mở bảng điều khiển và trải nghiệm tính năng nhé!",
                    side: "top", align: "center", showButtons: []
                },
                onHighlighted: () => {
                    const btn = document.querySelector('[data-tour="device-control-btn"]') as HTMLElement;
                    if (btn) {
                        btn.onclick = (e) => {
                            e.stopImmediatePropagation();
                            if (afterAddDeviceDriverObj) afterAddDeviceDriverObj.destroy();
                        };
                    }
                }
            }
        ];

        afterAddDeviceDriverObj = driver({
            showProgress: true,
            allowClose: false,
            showButtons: ['next', 'previous'],
            nextBtnText: "Tiếp tục",
            prevBtnText: "Bỏ qua",
            doneBtnText: "Hoàn tất",
            onPrevClick: () => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem("tour:afterAddDevice", "1");
                    localStorage.removeItem("JUST_ADDED_DEVICE");
                }
                if (afterAddDeviceDriverObj) afterAddDeviceDriverObj.destroy();
            },
            steps: dynamicSteps,
            onDestroyStarted: () => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem("tour:afterAddDevice", "1");
                    localStorage.removeItem("JUST_ADDED_DEVICE");
                }
            }
        });

        afterAddDeviceDriverObj.drive();
    }, 300); // Thời gian chờ đủ dài để giao diện cũ đóng lại
};