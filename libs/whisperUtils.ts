export const triggerSmartWhisper = (isForced = false, isTestMode = false) => {
    if (typeof window === 'undefined') return;

    // --- LOGIC CHUẨN KHI CHẠY PRODUCTION ---
    if (!isForced && !isTestMode) {
        const MAX_AUTO_WHISPERS = 3; 
        const COOLDOWN_MS = 24 * 60 * 60 * 1000; 
        const whisperCount = parseInt(localStorage.getItem("auto_whisper_count") || "0");
        const lastTime = parseInt(localStorage.getItem("auto_whisper_last_time") || "0");
        const now = Date.now();

        if (whisperCount >= MAX_AUTO_WHISPERS) return; 
        if (now - lastTime < COOLDOWN_MS) return; 

        localStorage.setItem("auto_whisper_count", (whisperCount + 1).toString());
        localStorage.setItem("auto_whisper_last_time", now.toString());
    }

    // 1. Quét tìm tất cả các nút ?
    const allHelpBtns = Array.from(document.querySelectorAll('.target-help-btn'));

    // 2. Lọc lấy nút đang hiển thị ở lớp trên cùng
    const activeHelpBtn = allHelpBtns.reverse().find(btn => {
        const rect = btn.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    });

    if (!activeHelpBtn || document.querySelector('.driver-active-element')) return;

    clearWhisperImmediately();

    // 3. Tiến hành tạo Element chữ lơ lửng
    const rect = activeHelpBtn.getBoundingClientRect();
    const hintEl = document.createElement('div');
    hintEl.className = 'help-whisper-text';
    hintEl.innerHTML = 'Xem lại hướng dẫn 👉';
    
    // Căn giữa theo chiều dọc và lùi ra 10px để chừa chỗ cho mũi nhọn tam giác
    hintEl.style.top = `${rect.top + (rect.height / 2)}px`; 
    hintEl.style.left = `${rect.left - 10}px`;

    document.body.appendChild(hintEl);

    requestAnimationFrame(() => {
        hintEl.classList.add('show');
    });

    // 4. Dọn dẹp
    setTimeout(() => {
        hintEl.classList.remove('show');
        setTimeout(() => {
            if (hintEl.parentNode) hintEl.remove();
        }, 600);
    }, 3500);
};

export const clearWhisperImmediately = () => {
    if (typeof window === 'undefined') return;
    const existingWhispers = document.querySelectorAll('.help-whisper-text');
    existingWhispers.forEach(el => el.remove());
};