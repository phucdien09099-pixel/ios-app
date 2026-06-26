// src/types/config.ts

export interface ConfigDB {
    id: string;
    name: string | null;
    room_id: string;
    config_type: string;
    device_id: string;
    device_type: string;
    power: string;
    trigger_time: string;
    days_of_week: string;
    duration_minutes: number | null;
    action: string | null;
    is_active: number;
    created_at?: string;
}
