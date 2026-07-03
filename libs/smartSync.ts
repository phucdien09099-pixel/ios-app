import { getDB } from "@/db";
import { apiClient } from "@/utils/Tauri/HttpClient";

export type SmartRoomResponse = {
    id: string;
    ownerAccountId: number;
    ownerEmail?: string | null;
    ownerMqttUser?: string | null;
    name: string;
    note?: string | null;
    createdAt?: string;
};

export type SmartDeviceResponse = {
    id: string;
    roomId: string;
    ownerAccountId?: number;
    ownerEmail?: string | null;
    ownerMqttUser?: string | null;
    parentId?: string | null;
    name: string;
    status?: string | null;
    type?: string | null;
    serial?: string | null;
    brand?: string | null;
    irTemplateId?: string | null;
    createdAt?: string;
};

export type SmartPermissionRequest = {
    accountId: number;
    canView: boolean;
    canControl: boolean;
    canEdit: boolean;
};

export type SmartPermissionResponse = SmartPermissionRequest & {
    id: string;
    createdAt?: string;
};

const SMART_DATA_TABLES = [
    "deviceRemoteButtons",
    "configs",
    "automations",
    "device_permissions",
    "room_permissions",
    "devices",
    "rooms",
];

const MQTT_OWNER_MAP_KEY = "smart:mqttOwnerByRoom";

const getCurrentUserEmail = () => {
    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}") as { email?: string };
        return user.email?.trim().toLowerCase() || "";
    } catch {
        return "";
    }
};

export function upsertMqttOwner(roomName: string, ownerMqttUser?: string | null) {
    if (!roomName) return;

    const owner = (ownerMqttUser || getCurrentUserEmail()).trim().toLowerCase();
    if (!owner) return;

    try {
        const current = JSON.parse(localStorage.getItem(MQTT_OWNER_MAP_KEY) || "{}") as Record<string, string>;
        current[roomName] = owner;
        localStorage.setItem(MQTT_OWNER_MAP_KEY, JSON.stringify(current));
    } catch {
        localStorage.setItem(MQTT_OWNER_MAP_KEY, JSON.stringify({ [roomName]: owner }));
    }
}

export async function clearLocalSmartData() {
    const db = await getDB();
    await db.execute("PRAGMA foreign_keys = ON;");

    for (const table of SMART_DATA_TABLES) {
        await db.execute(`DELETE FROM ${table}`);
    }
    localStorage.removeItem(MQTT_OWNER_MAP_KEY);
}

export async function getServerRooms() {
    return apiClient.get<SmartRoomResponse[]>("/api/smart/rooms");
}

export async function getServerDevices(roomId: string) {
    return apiClient.get<SmartDeviceResponse[]>(
        `/api/smart/devices?roomId=${encodeURIComponent(roomId)}`
    );
}

export async function createServerRoom(data: { name: string; note?: string | null }) {
    return apiClient.post<SmartRoomResponse>("/api/smart/rooms", {
        name: data.name,
        note: data.note ?? null,
    });
}

export async function createServerDevice(data: {
    roomId: string;
    parentId?: string | null;
    name: string;
    status?: string | null;
    type?: string | null;
    serial?: string | null;
    brand?: string | null;
    irTemplateId?: string | null;
}) {
    return apiClient.post<SmartDeviceResponse>("/api/smart/devices", {
        roomId: data.roomId,
        parentId: data.parentId ?? null,
        name: data.name,
        status: data.status ?? null,
        type: data.type ?? null,
        serial: data.serial ?? null,
        brand: data.brand ?? null,
        irTemplateId: data.irTemplateId ?? null,
    });
}

export async function hasServerSmartData() {
    const rooms = await getServerRooms();
    return rooms.length > 0;
}

export async function syncSmartDataFromServer(options?: { replaceLocal?: boolean }) {
    const db = await getDB();
    await db.execute("PRAGMA foreign_keys = ON;");

    if (options?.replaceLocal) {
        await clearLocalSmartData();
    }

    const rooms = await getServerRooms();
    const allDevices: SmartDeviceResponse[] = [];

    for (const room of rooms) {
        await db.execute(
            `
            INSERT INTO rooms (id, name, note, created_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                note = excluded.note
            `,
            [room.id, room.name, room.note ?? null, room.createdAt ?? new Date().toISOString()]
        );
        upsertMqttOwner(room.name, room.ownerMqttUser || room.ownerEmail);

        const devices = await getServerDevices(room.id);
        allDevices.push(...devices);
    }

    for (const device of allDevices) {
        await db.execute(
            `
            INSERT INTO devices (
                id, room_id, parent_id, name, status, type, serial, brand, created_at
            )
            VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                room_id = excluded.room_id,
                name = excluded.name,
                status = excluded.status,
                type = excluded.type,
                serial = excluded.serial,
                brand = excluded.brand
            `,
            [
                device.id,
                device.roomId,
                device.name,
                device.status ?? null,
                device.type ?? null,
                device.serial ?? null,
                device.brand ?? null,
                device.createdAt ?? new Date().toISOString(),
            ]
        );
    }

    for (const device of allDevices) {
        if (!device.parentId) continue;

        await db.execute(
            `
            UPDATE devices
            SET parent_id = ?
            WHERE id = ?
            `,
            [device.parentId, device.id]
        );
    }

    localStorage.setItem("smart:lastSyncAt", new Date().toISOString());

    return {
        rooms: rooms.length,
        devices: allDevices.length,
    };
}

export async function setServerRoomPermission(roomId: string, permission: SmartPermissionRequest) {
    return apiClient.post(`/api/smart/rooms/${encodeURIComponent(roomId)}/permissions`, permission);
}

export async function setServerDevicePermission(deviceId: string, permission: SmartPermissionRequest) {
    return apiClient.post(`/api/smart/devices/${encodeURIComponent(deviceId)}/permissions`, permission);
}

export async function getServerRoomPermissions(roomId: string) {
    return apiClient.get<SmartPermissionResponse[]>(
        `/api/smart/rooms/${encodeURIComponent(roomId)}/permissions`
    );
}

export async function getServerDevicePermissions(deviceId: string) {
    return apiClient.get<SmartPermissionResponse[]>(
        `/api/smart/devices/${encodeURIComponent(deviceId)}/permissions`
    );
}

export async function deleteServerRoomPermission(roomId: string, permissionId: string) {
    return apiClient.delete(`/api/smart/rooms/${encodeURIComponent(roomId)}/permissions/${encodeURIComponent(permissionId)}`);
}

export async function deleteServerDevicePermission(deviceId: string, permissionId: string) {
    return apiClient.delete(`/api/smart/devices/${encodeURIComponent(deviceId)}/permissions/${encodeURIComponent(permissionId)}`);
}
