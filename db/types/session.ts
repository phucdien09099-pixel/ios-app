// src/types/session.ts

export interface UserSession {
    id: string;

    user_id: string;

    refresh_token: string;

    access_token?: string | null;

    device_name?: string | null;
    device_type?: string | null;

    ip_address?: string | null;

    expires_at?: string | null;

    created_at?: string;
}