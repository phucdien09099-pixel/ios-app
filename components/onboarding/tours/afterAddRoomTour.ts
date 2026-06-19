import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export let detailTourObj: any = null;
const baseConfig = {
    showProgress: false,
    animate: true,
    overlayColor: 'rgba(0, 0, 0, 0.6)',
    popoverClass: 'max-w-[250px] w-full text-sm', 
};

export const startDetailTour = (roomId: string) => {
    if (typeof window !== 'undefined' && localStorage.getItem("tour:detail") === "1") {
        return;
    }
    detailTourObj = driver({
        ...baseConfig,
        steps: [
            {
                element: `[data-tour="room-card-${roomId}"]`,
                popover: {
                    title: 'Khám phá phòng',
                    description: 'Phòng của bạn đã được tạo! Hãy nhấn vào nút Detail để vào bên trong thêm thiết bị nhé.',
                    side: 'bottom',
                    align: 'center',
                    showButtons: [],
                },
                onHighlightStarted: (element) => {
                    if (!element) return;
                    
                    const detailBtn = element.querySelector(`[data-tour="detail-btn-${roomId}"]`) as HTMLElement;
                    if (detailBtn) {
                        detailBtn.style.position = 'relative';
                        
                        if (!document.getElementById('tour-finger-pointer')) {
                            const pointer = document.createElement('div');
                            pointer.id = 'tour-finger-pointer';
                            pointer.innerHTML = '👇';
                            pointer.className = 'absolute -top-7 left-1/2 -translate-x-1/2 text-xl animate-bounce z-[99999] pointer-events-none';
                            
                            detailBtn.appendChild(pointer);
                        }
                    }
                }
            }
        ]
    });
    
    const originalDestroy = detailTourObj.destroy.bind(detailTourObj);
    detailTourObj.destroy = () => {
        const pointer = document.getElementById('tour-finger-pointer');
        if (pointer) pointer.remove();
        if (typeof window !== 'undefined') localStorage.setItem("tour:detail", "1");
        originalDestroy();
    };

    detailTourObj.drive();
};