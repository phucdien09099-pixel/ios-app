// src/types/room.ts

import { Device } from "./devive";

export type Room = {
    id: string;
    name: string;
    note?: string;
    devices?: Device[];
    created_at?: string;
};