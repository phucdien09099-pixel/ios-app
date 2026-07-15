import { apiClient } from "@/utils/Tauri/HttpClient";
import {
    checkPermissions,
    getToken,
    register as registerForPushNotifications,
    requestPermissions,
} from "tauri-plugin-fcm";

export type NotificationContentRequest = {
    title: string;
    body: string;
    imageUrl?: string | null;
    data?: Record<string, string>;
};

export type NotificationSendResponse = {
    targetCount: number;
    successCount: number;
    failureCount: number;
    disabledTokenCount: number;
};

export type FcmPlatform = "ANDROID" | "IOS" | "WEB";

export type FcmTokenRequest = {
    token: string;
    platform: FcmPlatform;
    deviceName?: string;
};

export type FcmTokenResponse = {
    id: number;
    accountId: number;
    platform: FcmPlatform;
    deviceName?: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
};

function detectFcmPlatform(): FcmPlatform {
    const userAgent = navigator.userAgent;
    if (/android/i.test(userAgent)) return "ANDROID";
    if (/iPad|iPhone|iPod/i.test(userAgent)) return "IOS";
    return "WEB";
}

export async function registerFcmToken(request: FcmTokenRequest) {
    return apiClient.post<FcmTokenResponse>("/api/fcm/tokens", {
        token: request.token,
        platform: request.platform,
        deviceName: request.deviceName?.slice(0, 160),
    });
}

/** Gets the native FCM token and registers it for the authenticated account. */
export async function registerDeviceFcmToken(): Promise<FcmTokenResponse | null> {
    if (typeof window === "undefined") return null;

    const platform = detectFcmPlatform();
    if (platform === "WEB") {
        console.info("Bỏ qua đăng ký FCM: tauri-plugin-fcm chỉ hỗ trợ Android và iOS.");
        return null;
    }

    let permission = await checkPermissions();
    console.info("Trạng thái quyền thông báo FCM:", permission);
    if (permission === "prompt" || permission === "prompt-with-rationale") {
        permission = await requestPermissions();
    }
    if (permission !== "granted") {
        throw new Error(`Quyền thông báo FCM chưa được cấp: ${permission}`);
    }

    await registerForPushNotifications();
    const { token } = await getToken();
    if (!token?.trim()) {
        throw new Error("tauri-plugin-fcm không trả về registration token");
    }

    console.info("Đã lấy FCM token từ thiết bị, đang đăng ký với server.");
    const registeredToken = await registerFcmToken({
        token: token.trim(),
        platform,
        deviceName: navigator.userAgent.slice(0, 160),
    });
    console.info("Server đã đăng ký FCM token:", registeredToken.id);
    return registeredToken;
}

export async function sendNotificationToMe(notification: NotificationContentRequest) {
    return apiClient.post<NotificationSendResponse>("/api/fcm/notifications/me", {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl ?? null,
        data: notification.data ?? {},
    });
}

