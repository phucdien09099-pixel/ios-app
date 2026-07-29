import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { startEmptyRoomTour } from "./emptyRoomTour";
import { triggerSmartWhisper } from "@/libs/whisperUtils";

export let afterAddDeviceDriverObj: any = null;

let savedDeviceStepIndex = 0;
export let isTourPausedForDrawer = false;

let startTimeoutId: NodeJS.Timeout | null = null;
let resumeTimeoutId: NodeJS.Timeout | null = null;

export const startAfterAddDeviceTour = (force = false, startIndex = 0) => {
    const isResuming = startIndex > 0;

    if (isTourPausedForDrawer) {
        return; 
    }

    if (!isResuming) {
        let isChainForced = false;
        if (typeof window !== 'undefined') {
            isChainForced = sessionStorage.getItem("trigger_after_add_device") === "1";
        }
        const shouldForce = force || isChainForced;

        if (!shouldForce && typeof window !== 'undefined' && localStorage.getItem("tour:afterAddDevice") === "1") {
            return;
        }

        if (document.querySelector('[data-tour="device-save-btn"]')) {
            return;
        }
    }

    if (afterAddDeviceDriverObj) {
        afterAddDeviceDriverObj.destroy();
        afterAddDeviceDriverObj = null;
    }

    if (startTimeoutId) clearTimeout(startTimeoutId);

    startTimeoutId = setTimeout(() => {
        // 🟢 FIX 1: Tự động reset ID về null khi timeout đã chạy xong
        startTimeoutId = null; 

        if (isTourPausedForDrawer) return;

        const hasDevice = document.querySelector('[data-tour^="device-card-"]') !== null;

        if (!hasDevice && !isResuming) {
            startEmptyRoomTour(force);
            return;
        }

        let dynamicSteps: any[] = [
            { element: '[data-tour^="device-card-"]', popover: { title: "Thiết bị của bạn đây!", description: "Trạng thái Online/Offline trực tiếp trên thẻ.", side: "bottom", align: "center" } },
            { element: '[data-tour="device-control-btn"]', popover: { title: "Bảng điều khiển", description: "Nhấn vào đây để bật/tắt.", side: "top", align: "center" } },
            { element: '[data-tour="device-delete-btn"]', popover: { title: "Xóa thiết bị", description: "Nếu không dùng nữa, bạn có thể xóa thiết bị nhanh bằng nút này.", side: "left", align: "center" } },
            { element: '[data-tour="alarm-settings-btn"]', popover: { title: "Báo thức", description: "Thiết lập các mốc thời gian báo thức cho phòng tại đây.", side: "left", align: "center" } },
            { element: '[data-tour="detail-btn-inside"]', popover: { title: "Cài đặt nâng cao", description: "Mở bảng cài đặt và tinh chỉnh đèn/thiết bị cho phòng này.", side: "left", align: "center" } },
            { element: '[data-tour="device-control-btn"]', popover: { title: "Khám phá ngay! 🚀", description: "Bây giờ, hãy tự mình nhấn vào đây để trải nghiệm nhé!", side: "top", align: "center" } }
        ];

        afterAddDeviceDriverObj = driver({
            showProgress: true,
            allowClose: false,
            showButtons: ['next', 'previous'],
            nextBtnText: "Tiếp tục",
            prevBtnText: "Bỏ qua",
            doneBtnText: "Hoàn tất",
            onPrevClick: () => {
                if (typeof window !== 'undefined') localStorage.setItem("tour:afterAddDevice", "1");
                if (afterAddDeviceDriverObj) {
                    afterAddDeviceDriverObj.destroy();
                    afterAddDeviceDriverObj = null;
                }
                setTimeout(() => {
                    triggerSmartWhisper(true, false);
                }, 300);
                savedDeviceStepIndex = 0; 
            },
            steps: dynamicSteps,
            onDestroyStarted: () => {
                if (!isTourPausedForDrawer && typeof window !== 'undefined') {
                    if (afterAddDeviceDriverObj && !afterAddDeviceDriverObj.hasNextStep()) {
                        localStorage.setItem("tour:afterAddDevice", "1");
                    }
                }
                if (afterAddDeviceDriverObj) {
                    afterAddDeviceDriverObj.destroy();
                    afterAddDeviceDriverObj = null;
                }
                // 🟢 FIX 2: Tẩy não khi tour bị destroy
                savedDeviceStepIndex = 0; 
            }
        });

        afterAddDeviceDriverObj.drive(startIndex);
    }, 300);
};

export const pauseTourForDeviceDrawer = () => {
    // Nếu cả 3 biến này đều null/trống -> Hoàn toàn không có Tour nào đang hoạt động
    if (!afterAddDeviceDriverObj && !startTimeoutId && !resumeTimeoutId) {
        return; 
    }

    isTourPausedForDrawer = true; 

    // 🟢 FIX 1: Clear xong phải ép về null để chốt chặn if() phía trên hoạt động đúng ở lần sau
    if (startTimeoutId) {
        clearTimeout(startTimeoutId);
        startTimeoutId = null; 
    }
    if (resumeTimeoutId) {
        clearTimeout(resumeTimeoutId);
        resumeTimeoutId = null; 
    }

    if (afterAddDeviceDriverObj) {
        const currentIndex = afterAddDeviceDriverObj.getActiveIndex();
        if (currentIndex !== undefined) {
            savedDeviceStepIndex = currentIndex;
        }
        afterAddDeviceDriverObj.destroy();
        afterAddDeviceDriverObj = null;
    }
    
    if (typeof document !== 'undefined') {
        document.querySelectorAll('.driver-popover, .driver-overlay, .driver-js-shadow').forEach(el => el.remove());
        document.querySelectorAll('.driver-active-element').forEach(el => el.classList.remove('driver-active-element'));
    }
};

export const resumeTourAfterDeviceDrawer = () => {
    if (isTourPausedForDrawer) {
        isTourPausedForDrawer = false; 
        
        if (resumeTimeoutId) clearTimeout(resumeTimeoutId);

        resumeTimeoutId = setTimeout(() => {
            // 🟢 FIX 1: Tự reset ID về null khi kích hoạt
            resumeTimeoutId = null; 
            
            if (!isTourPausedForDrawer) {
                startAfterAddDeviceTour(true, savedDeviceStepIndex + 1); 
            }
        }, 400);
    }
};