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
    async getDevices() {
        return await this.query<Device>(
            `
            SELECT *
            FROM devices
            WHERE serial NOT NULL
            `
        );
    }


    // ================= BY ROOM =================

    async getByRoom(roomId: string) {
        return await this.query<Device>(
            `
            SELECT *
            FROM devices
            WHERE room_id = ?
              AND type != 'HUB'
            `,
            [roomId]
        );
    }

    async getByHubDevice(roomId: string) {
        return await this.query<Device>(
            `
            SELECT *
            FROM devices
            WHERE room_id = ?
              AND type = 'HUB'
            `,
            [roomId]
        );
    }



    async getMqttTopic(deviceId: string): Promise<string> {
        // Sử dụng luôn phương thức this.query từ lớp cha SQLiteBase để đảm bảo cùng connection
        const queryResult = await this.query<any>(
            `
            SELECT
                d.type,
                d.serial as device_serial,
                parent.serial as parent_serial,
                r.name as room_name
            FROM devices d
            JOIN rooms r ON d.room_id = r.id
            LEFT JOIN devices parent ON d.parent_id = parent.id
            WHERE d.id = ?
            `,
            [deviceId]
        );

        // Kiểm tra nếu mảng kết quả trống
        if (!queryResult || queryResult.length === 0) {
            throw new Error("Device not found");
        }

        const row = queryResult[0];

        // Mẹo fallback logic:
        // - Thiết bị IOT / HUB sẽ lấy chính `device_serial`
        // - Thiết bị IR sẽ lấy `parent_serial` của Hub quản lý nó
        const finalSerial = row.device_serial || row.parent_serial;

        if (!finalSerial) {
            throw new Error("Không tìm thấy Serial hợp lệ (thiết bị độc lập thiếu serial hoặc chưa gán vào HUB).");
        }

        // Trả về đúng định dạng mong muốn: device/{roomName}/{serial}
        return `device/${row.room_name}/${finalSerial}`;
    }
}

export const deviceRepo = new DeviceRepository();
