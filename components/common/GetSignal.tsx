import {
    SignalLowIcon,
    SignalMediumIcon,
    SignalFull01Icon
} from "@hugeicons/core-free-icons";

// Hàm quyết định màu sắc và icon dựa trên chỉ số RSSI
export const getSignalDetails = (rssi?: number) => {
    if (!rssi) return { icon: SignalLowIcon, color: "text-muted-foreground", label: "Không rõ" };

    // Sóng khỏe: lớn hơn hoặc bằng -65 dBm
    if (rssi >= -65) {
        return { icon: SignalFull01Icon, color: "text-green-500", label: "Khỏe" };
    }
    // Sóng trung bình: từ -85 dBm đến -66 dBm
    if (rssi >= -85) {
        return { icon: SignalMediumIcon, color: "text-amber-500", label: "Vừa" };
    }
    // Sóng yếu: dưới -85 dBm
    return { icon: SignalLowIcon, color: "text-destructive", label: "Yếu" };
};
