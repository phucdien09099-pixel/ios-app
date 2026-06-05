// db/repository/AutomationRepository.ts

import { SQLiteBase } from "@/db/SQLiteBase";
import { AutomationDB } from "../types/automation"; 

class AutomationRepository extends SQLiteBase<AutomationDB> {
    constructor() {
        super("automations");
    }

    // ================= CREATE =================
    async createAutomation(data: Omit<AutomationDB, "id" | "created_at"> & { id?: string }) {
        return await this.create({
            id: data.id ?? crypto.randomUUID(),
            ...data,
        } as AutomationDB);
    }

    // ================= GET BY ROOM =================
    async getByRoom(roomId: string) {
        return await this.query<AutomationDB>(
            `
            SELECT * FROM automations 
            WHERE room_id = ?
            ORDER BY created_at DESC
            `,
            [roomId]
        );
    }

    // ================= DELETE =================
    async deleteAutomation(id: string) {
        return await this.execute(`DELETE FROM automations WHERE id = ?`, [id]);
    }
}

// Khởi tạo và export
export const automationRepo = new AutomationRepository();