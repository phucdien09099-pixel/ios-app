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
                // 🟢 Highlight TOÀN BỘ CARD PHÒNG để ngắm thành quả
                element: `[data-tour="room-card-${roomId}"]`,
                popover: {
                    title: 'Khám phá phòng',
                    description: 'Phòng của bạn đã được tạo! Hãy nhấn vào nút Detail để vào bên trong thêm thiết bị nhé.',
                    side: 'bottom',
                    align: 'center',
                    showButtons: [], // Ẩn nút điều hướng mặc định, buộc click vào card/nút detail
                },
                // 🟢 Hàm chuẩn của driver.js để chèn ngón tay/mũi tên động vào nút Detail mà không lỗi TypeScript
                onHighlightStarted: (element) => {
                    if (!element) return;
                    
                    // Tìm nút Detail nằm bên trong Card đang được highlight
                    const detailBtn = element.querySelector(`[data-tour="detail-btn-${roomId}"]`) as HTMLElement;
                    if (detailBtn) {
                        detailBtn.style.position = 'relative';
                        
                        // Kiểm tra nếu chưa tồn tại icon chỉ hướng thì tự sinh ra
                        if (!document.getElementById('tour-finger-pointer')) {
                            const pointer = document.createElement('div');
                            pointer.id = 'tour-finger-pointer';
                            pointer.innerHTML = '👇'; // Bạn có thể đổi thành 👈 hoặc 👆 tùy vị trí nút
                            
                            // Sử dụng tailwind animate-bounce để tạo hiệu ứng nhún nhảy chỉ tay
                            pointer.className = 'absolute -top-7 left-1/2 -translate-x-1/2 text-xl animate-bounce z-[99999] pointer-events-none';
                            
                            detailBtn.appendChild(pointer);
                        }
                    }
                }
            }
        ]
    });
    
    // Tự động dọn dẹp icon ngón tay khi tour kết thúc (user bấm vào nút hoặc thoát)
    const originalDestroy = detailTourObj.destroy.bind(detailTourObj);
    detailTourObj.destroy = () => {
        const pointer = document.getElementById('tour-finger-pointer');
        if (pointer) pointer.remove();
        if (typeof window !== 'undefined') localStorage.setItem("tour:detail", "1");
        originalDestroy();
    };

    detailTourObj.drive();
};