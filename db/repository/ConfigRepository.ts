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