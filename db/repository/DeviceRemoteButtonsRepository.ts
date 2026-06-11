import { SQLiteBase } from "@/db/SQLiteBase";
import { DeviceRemoteButtonEntity } from "../types/deviceRemote";

class DeviceRemoteButtonsRepository extends SQLiteBase<DeviceRemoteButtonEntity> {
    constructor() {
        super("deviceRemoteButtons");
    }

    async getByDeviceId(deviceId: string): Promise<DeviceRemoteButtonEntity[]> {
        try {
            const result = await this.query(
                "SELECT * FROM deviceRemoteButtons WHERE device_id = ? ORDER BY updated_at ASC",
                [deviceId]
            );

            return result as DeviceRemoteButtonEntity[];
        } catch (error) {
            console.error(`[Repository] Failed to load remote buttons for device ${deviceId}:`, error);
            throw error;
        }
    }

    async upsertMany(deviceId: string, buttons: any[]): Promise<void> {
        try {
            await this.execute("DELETE FROM deviceRemoteButtons WHERE device_id = ?", [deviceId]);

            const queryStr = `
                INSERT OR REPLACE INTO deviceRemoteButtons (id, device_id, name, code_key, icon_key, learned, data_base64, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            for (const btn of buttons) {
                await this.execute(queryStr, [
                    btn.id,
                    deviceId,
                    btn.name,
                    btn.codeKey,
                    btn.iconKey,
                    btn.learned ? 1 : 0,
                    btn.dataBase64 || null,
                    btn.updatedAt || new Date().toISOString(),
                ]);
            }
        } catch (error) {
            console.error("[Repository] Failed to sync remote buttons:", error);
            throw error;
        }
    }

    async deleteButton(buttonId: string): Promise<void> {
        try {
            await this.execute("DELETE FROM deviceRemoteButtons WHERE id = ?", [buttonId]);
        } catch (error) {
            console.error(`[Repository] Failed to delete remote button ${buttonId}:`, error);
            throw error;
        }
    }
}

export const deviceRemoteButtonsRepository = new DeviceRemoteButtonsRepository();
