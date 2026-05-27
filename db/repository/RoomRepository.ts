// src/repositories/RoomRepository.ts

import { SQLiteBase } from "@/db/SQLiteBase";
import { Room } from "../types/room";


class RoomRepository extends SQLiteBase<Room> {

    constructor() {
        super("rooms");
    }

    async deleteRoom(id: string) {
        // optional:
        // delete devices thuộc room trước

        await this.execute(
            `DELETE FROM devices WHERE room_id = ?`,
            [id]
        );

        await this.execute(
            `DELETE FROM rooms WHERE id = ?`,
            [id]
        );

        return true;
    }
    async getRooms() {
        return await this.findAll();
    }
    async getRoomsWithDevices() {

        const rows = await this.query<any>(`
            SELECT
                rooms.id as id,
                rooms.name as room_name,
                rooms.note as room_note,

                devices.id as device_id,
                devices.name as device_name,
                devices.status as device_status,
                devices.type as device_type,
                devices.brand as device_brand

            FROM rooms
            LEFT JOIN devices
                ON devices.room_id = rooms.id
            ORDER BY rooms.id
        `);

        const map = new Map<string, any>();

        for (const row of rows) {

            if (!map.has(row.id)) {

                map.set(row.id, {
                    id: row.id,
                    name: row.room_name,
                    note: row.room_note,
                    devices: [],
                });
            }

            if (row.device_id) {

                map.get(row.id).devices.push({
                    id: row.device_id,
                    name: row.device_name,
                    status: row.device_status,
                    type: row.device_type,
                    brand: row.device_brand,
                });
            }
        }

        return Array.from(map.values());
    }
}

export const roomRepo = new RoomRepository();