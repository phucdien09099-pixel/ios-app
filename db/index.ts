// src/database/db.ts

import Database from "@tauri-apps/plugin-sql";
let db: Database | null = null;
export async function getDB() {
    if (db) {
        return db;
    }
    db = await Database.load(
        "sqlite:iot.db"
    );
    return db;
}