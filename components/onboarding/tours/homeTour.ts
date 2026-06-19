import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export let homeDriverObj: any = null;

export function startHomeTour(force = false) {
    // Nếu không force và đã xem rồi thì bỏ qua
    if (!force && typeof window !== 'undefined' && localStorage.getItem("tour:home") === "1") {
        return;
    }

    if (homeDriverObj) homeDriverObj.destroy();

    const hasRoom = document.querySelector('[data-tour^="room-card-"]') !== null;
    let dynamicSteps: any[] = [];

    if (!hasRoom) {
        dynamicSteps = [
            { element: '[data-tour="add-room-button"]', popover: { title: "Tạo khu vực đầu tiên", description: "Nhấn vào dấu + này để tạo khu vực đầu tiên của bạn.", side: "bottom" } }
        ];
    } else {
        dynamicSteps = [
            {
                element: '[data-tour^="room-card-"]', 
                popover: { 
                    title: "Quản lý thiết bị", 
                    description: "Phòng của bạn ở đây! Hãy nhấn vào nút Detail để vào trong và thêm các thiết bị.", 
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

    // ❌ ĐÃ XÓA ĐOẠN if (force) dynamicSteps.unshift(...) Ở ĐÂY

    homeDriverObj = driver({
        showProgress: true,
        allowClose: false,
        nextBtnText: "Tiếp theo",
        prevBtnText: "Quay lại", // Trả về tên đúng nghĩa của nó
        doneBtnText: "Hoàn tất",
        // ❌ ĐÃ XÓA onPrevClick Ở ĐÂY
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