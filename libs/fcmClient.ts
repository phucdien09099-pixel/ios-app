import { apiClient } from "@/utils/Tauri/HttpClient";

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

export async function sendNotificationToMe(notification: NotificationContentRequest) {
    return apiClient.post<NotificationSendResponse>("/api/fcm/notifications/me", {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl ?? null,
        data: notification.data ?? {},
    });
}

