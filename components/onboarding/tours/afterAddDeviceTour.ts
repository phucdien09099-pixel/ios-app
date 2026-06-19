import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { startEmptyRoomTour } from "./emptyRoomTour"; 

export let afterAddDeviceDriverObj: any = null;

export const startAfterAddDeviceTour = (force = false) => {
    if (!force && typeof window !== 'undefined' && localStorage.getItem("tour:afterAddDevice") === "1") {
        return;
    }

    if (afterAddDeviceDriverObj) afterAddDeviceDriverObj.destroy();

    // Dùng setTimeout nhỏ để đảm bảo React đã vẽ xong giao diện Card Thiết bị
    setTimeout(() => {
        const hasDevice = document.querySelector('[data-tour^="device-card-"]') !== null;

        // ==========================================
        // 🟢 NGỮ CẢNH A: PHÒNG TRỐNG
        // ==========================================
        if (!hasDevice) {
            if (force) {
                afterAddDeviceDriverObj = driver({
                    showProgress: false,
                    allowClose: false,
                    showButtons: ['next', 'previous'],
                    nextBtnText: "Tiếp tục",
                    prevBtnText: "Bỏ qua", 
                    steps: [
                        {
                            popover: {
                                title: "👋 Trợ giúp thao tác",
                                description: "Bạn có muốn xem hướng dẫn thêm thiết bị không?",
                            }
                        }
                    ],
                    onNextClick: () => {
                        if (afterAddDeviceDriverObj) afterAddDeviceDriverObj.destroy();
                        startEmptyRoomTour(); // Chạy hướng dẫn bàn tay
                    },
                    onPrevClick: () => {
                        if (afterAddDeviceDriverObj) afterAddDeviceDriverObj.destroy();
                    }
                });
                afterAddDeviceDriverObj.drive();
            } else {
                startEmptyRoomTour();
            }
            return;
        }

        // ==========================================
        // 🟢 NGỮ CẢNH B: ĐÃ CÓ THIẾT BỊ
        // ==========================================
        let dynamicSteps: any[] = [
            { element: '[data-tour^="device-card-"]', popover: { title: "Thiết bị của bạn đây!", description: "Trạng thái Online/Offline trực tiếp trên thẻ.", side: "bottom", align: "center" } },
            { element: '[data-tour="device-control-btn"]', popover: { title: "Bảng điều khiển", description: "Nhấn vào đây để bật/tắt.", side: "top", align: "center" } },
            { element: '[data-tour="device-delete-btn"]', popover: { title: "Xóa thiết bị", description: "Nếu không dùng nữa, bạn có thể xóa thiết bị nhanh bằng nút này.", side: "left", align: "center" } },
            { element: '[data-tour="detail-btn-inside"]', popover: { title: "Cài đặt nâng cao", description: "Mở bảng cài đặt và tinh chỉnh đèn/thiết bị cho phòng này.", side: "left", align: "center" } },
            
            // Nếu bạn có BottomNavBar với các data-tour này, hãy để lại. Nếu không có, hãy comment chúng lại để tránh lỗi nhé!
            { element: '[data-tour="nav-feature"]', popover: { title: "Tính năng mở rộng", description: "Quản lý các tính năng chuyên sâu của phòng.", side: "top", align: "center" } },
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
                if (afterAddDeviceDriverObj) afterAddDeviceDriverObj.destroy();
            },
            steps: dynamicSteps,
            onDestroyStarted: () => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem("tour:afterAddDevice", "1");
                }
            }
        });

        afterAddDeviceDriverObj.drive();
    }, 150); 
};