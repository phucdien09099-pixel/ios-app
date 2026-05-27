import { getDB } from ".";

// src/database/init.ts
export async function initDB() {

    const db = await getDB();

    // ================= SESSION =================
    await db.execute(`
        CREATE TABLE IF NOT EXISTS user_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            refresh_token TEXT NOT NULL,
            access_token TEXT NOT NULL,
            device_name TEXT,
            device_type TEXT,
            expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        )
    `);
    // ================= USER =================
    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            parent_id TEXT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            role TEXT DEFAULT 'user',
            is_owner INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        )
    `);
    // ================= ROOMS =================

    await db.execute(`
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // ================= DEVICES =================

    await db.execute(`
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT,
            type TEXT,
            brand TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id)
            REFERENCES rooms(id)
            ON DELETE CASCADE
        )
    `);
}
