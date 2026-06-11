// db/types/automation.ts

export interface AutomationDB {
    id: string;
    room_id: string;
    name: string;
    trigger_config: string;
    deviceId: string;
    action: string;
    is_active: number;
    created_at?: string;
}
