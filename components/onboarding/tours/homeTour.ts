import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { triggerSmartWhisper } from "@/libs/whisperUtils";

export let homeDriverObj: any = null;

export function startHomeTour(force = false) {
    if (!force && typeof window !== 'undefined' && localStorage.getItem("tour:home") === "1") {
        return;
    }

    const isRoomFormOpen = document.querySelector('[data-tour="room-name"]') !== null 
                        || document.querySelector('[data-tour="scan-hub-qr"]') !== null;

    if (!force && isRoomFormOpen) {
        return;
    }

    if (homeDriverObj) homeDriverObj.destroy();

    const hasRoom = document.querySelector('[data-tour^="room-card-"]') !== null;
    let dynamicSteps: any[] = [];

    if (!hasRoom) {
        dynamicSteps = [
            { element: '[data-tour="add-room-button"]', popover: { title: "Tạo khu vực đầu tiên", description: "Nhấn vào đây để tạo khu vực đầu tiên của bạn.", side: "bottom" } }
        ];
    } else {
        dynamicSteps = [
            {
                element: '[data-tour^="room-card-"]', 
                popover: { 
                    title: "Quản lý thiết bị", 
                    description: "Phòng của bạn ở đây! Hãy nhấn vào nút Vào phòng để vào trong và thêm các thiết bị.", 
                    side: "bottom",
                    showButtons: [],
                },
                onHighlightStarted: () => {
                    setTimeout(() => {
                        const detailBtn = document.querySelector('[data-tour^="detail-btn-"]') as HTMLElement;
                        if (detailBtn) {
                            detailBtn.addEventListener('click', () => {
                                if (homeDriverObj) homeDriverObj.destroy();
                            });
                            detailBtn.style.position = 'relative';
                            if (!document.getElementById('tour-finger-pointer')) {
                                const pointer = document.createElement('div');
                                pointer.id = 'tour-finger-pointer';
                                pointer.innerHTML = '👇'; 
                                pointer.className = 'absolute -top-7 left-1/2 -translate-x-1/2 text-xl animate-bounce z-[99999] pointer-events-none';
                                detailBtn.appendChild(pointer);
                            }
                        }
                    }, 100);
                }
            },
            { element: '[data-tour="add-room-button"]', popover: { title: "Thêm khu vực khác", description: "Nhấn vào đây để tiếp tục tạo thêm phòng.", side: "left" } }
        ];
    }

    homeDriverObj = driver({
        showProgress: true,
        allowClose: false,
        nextBtnText: "Tiếp theo",
        prevBtnText: "Bỏ qua",
        onPrevClick: () => {
            if (typeof window !== 'undefined') {
                localStorage.setItem("tour:home", "1");
            }
            if (homeDriverObj) homeDriverObj.destroy();
            setTimeout(() => {
                triggerSmartWhisper(true, false);
            }, 300);
        },
        doneBtnText: "Hoàn tất",
        steps: dynamicSteps,
        onDestroyStarted: () => {
            if (typeof window !== 'undefined') localStorage.setItem("tour:home", "1");
            const pointer = document.getElementById('tour-finger-pointer');
            if (pointer) pointer.remove();
            if (homeDriverObj) {
                homeDriverObj.destroy();
                homeDriverObj = null;
            }
        }
    });

    homeDriverObj.drive();
}