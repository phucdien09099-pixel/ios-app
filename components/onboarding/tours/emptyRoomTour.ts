// components/onboarding/tours/emptyRoomTour.ts

export const startEmptyRoomTour = (force = false) => { 
    if (!force && typeof window !== 'undefined' && localStorage.getItem("tour:afterAddDevice") === "1") {
        return;
    }

    const targetElement = document.querySelector('[data-tour="header-add-device-btn"]');
    
    if (!targetElement) {
        console.warn("Không tìm thấy nút [data-tour='header-add-device-btn'] trên Header!");
        return;
    }

    document.getElementById('custom-finger-guide')?.remove();

    const finger = document.createElement('div');
    finger.id = 'custom-finger-guide';
    finger.className = 'fixed z-[99999] animate-bounce pointer-events-none drop-shadow-md transition-all text-2xl';
    finger.innerHTML = '👆'; 
    const rect = targetElement.getBoundingClientRect();
    finger.style.top = `${rect.bottom + 6}px`;
    finger.style.left = `${rect.left + (rect.width / 2) - 12}px`; 

    document.body.appendChild(finger);

    const handleAddDeviceClick = () => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem("force_tour_add_device", "1");
        }
        targetElement.removeEventListener('click', handleAddDeviceClick);
    };
    
    targetElement.addEventListener('click', handleAddDeviceClick);


    const handleRemoveFinger = () => {
        finger.remove();
        document.removeEventListener('click', handleRemoveFinger);
    };

    setTimeout(() => {
        document.addEventListener('click', handleRemoveFinger);
    }, 50);
};