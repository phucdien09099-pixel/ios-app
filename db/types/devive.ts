// src/types/device.ts

export type Device = {
    id: string;
    room_id: string;
    name: string;
    status?: string;
    type?: string;
    brand?: string;
    created_at?: string;
};