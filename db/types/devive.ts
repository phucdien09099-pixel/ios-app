// src/types/device.ts

export type DeviceType = 'HUB' | 'IOT' | 'IR';

export type Device = {
    id: string;
    room_id: string;
    parent_id?: string | null;
    name: string;
    status?: string;
    type?: DeviceType;
    serial?: string | null;
    brand?: string;
    created_at?: string;
};
