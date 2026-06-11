export interface DeviceRemoteButtonEntity {
    id: string;
    device_id: string;
    name: string;
    code_key: string;
    icon_key: string;
    learned: number; // Trong SQLite thường lưu boolean dạng INTEGER (0 hoặc 1)
    data_base64: string | null;
    updated_at: string;
}
