// src/repositories/DeviceRepository.ts

import { SQLiteBase }
    from "@/db/SQLiteBase";
import { Device } from "../types/devive";

class DeviceRepository extends SQLiteBase<Device> {
    constructor() {
        super("devices");
    }
    async createDevice(data: Omit<Device, "id"> & { id?: string }) {
        return await this.create({
            id: data.id ?? crypto.randomUUID(),
            ...data,
        });
    }
    async search(
        keyword: string,
        page: number = 1,
        limit: number = 10
    ) {

        return this.paginate(
            page,
            limit,
            {
                where: `
                    name LIKE ?
                    OR mac LIKE ?
                `,
                params: [
                    `%${keyword}%`,
                    `%${keyword}%`,
                ],
            }
        );
    }

    async deleteDevice(id: string) {
        return await this.execute(
            `
        DELETE FROM devices
        WHERE id = ?
        `,
            [id]
        );
    }

    async getOnlineDevices() {
        return await this.query<Device>(
            `
            SELECT *
            FROM devices
            WHERE is_online = 1
            `
        );
    }


    // ================= BY ROOM =================

    async getByRoom(
        roomId: any
    ) {

        return await this.query<Device>(
            `
            SELECT *
            FROM devices
            WHERE room_id = ?
            `,
            [roomId]
        );
    }
}

export const deviceRepo = new DeviceRepository();