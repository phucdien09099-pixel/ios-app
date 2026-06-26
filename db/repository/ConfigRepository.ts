// db/repository/ConfigRepository.ts

import { SQLiteBase } from "@/db/SQLiteBase";
import { ConfigDB } from "../types/config"; 

class ConfigRepository extends SQLiteBase<ConfigDB> {
    constructor() {
        super("configs");
    }

    // ================= CREATE (Tuỳ chỉnh thêm nếu cần) =================
    async createConfig(data: Omit<ConfigDB, "id" | "created_at"> & { id?: string }) {
        return await this.create({
            id: data.id ?? crypto.randomUUID(),
            ...data,
        } as ConfigDB);
    }

    // ================= GET BY DEVICE =================
    async getByDevice(deviceId: string) {
        return await this.query<ConfigDB>(
            `
            SELECT * FROM configs 
            WHERE device_id = ?
            ORDER BY created_at DESC
            `,
            [deviceId]
        );
    }

    async upsertConfig(data: Omit<ConfigDB, "created_at">) {
        return await this.execute(
            `
            INSERT INTO configs (
                id, name, room_id, config_type, device_id, device_type,
                power, trigger_time, days_of_week, duration_minutes, action, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                room_id = excluded.room_id,
                config_type = excluded.config_type,
                device_id = excluded.device_id,
                device_type = excluded.device_type,
                power = excluded.power,
                trigger_time = excluded.trigger_time,
                days_of_week = excluded.days_of_week,
                duration_minutes = excluded.duration_minutes,
                action = excluded.action,
                is_active = excluded.is_active
            `,
            [
                data.id,
                data.name,
                data.room_id,
                data.config_type,
                data.device_id,
                data.device_type,
                data.power,
                data.trigger_time,
                data.days_of_week,
                data.duration_minutes,
                data.action,
                data.is_active,
            ]
        );
    }

    // ================= DELETE BY DEVICE =================
    async deleteByDevice(deviceId: string) {
        return await this.execute(
            `
            DELETE FROM configs 
            WHERE device_id = ?
            `,
            [deviceId]
        );
    }
}

// Khởi tạo và export để dùng ở các file UI
export const configRepo = new ConfigRepository();
