// import { getDB } from ".";

// // src/database/init.ts
// export async function initDB() {

//     const db = await getDB();

//     // ================= ROOM_PERMISSION =================
//     await db.execute(`
//     CREATE TABLE IF NOT EXISTS room_permissions (
//         id TEXT PRIMARY KEY,
//         room_id TEXT NOT NULL,
//         user_id TEXT NOT NULL,

//         can_view INTEGER DEFAULT 1,
//         can_control INTEGER DEFAULT 0,
//         can_edit INTEGER DEFAULT 0,

//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

//         FOREIGN KEY (room_id)
//             REFERENCES rooms(id)
//             ON DELETE CASCADE,

//         FOREIGN KEY (user_id)
//             REFERENCES users(id)
//             ON DELETE CASCADE
//         )
//     `);
//     // ================= DEVICE_PERMISSION =================
//     await db.execute(`
//         CREATE TABLE IF NOT EXISTS device_permissions (
//             id TEXT PRIMARY KEY,
//             device_id TEXT NOT NULL,
//             user_id TEXT NOT NULL,

//             can_view INTEGER DEFAULT 1,
//             can_control INTEGER DEFAULT 0,
//             can_edit INTEGER DEFAULT 0,

//             created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

//             FOREIGN KEY (device_id)
//                 REFERENCES devices(id)
//                 ON DELETE CASCADE,

//             FOREIGN KEY (user_id)
//                 REFERENCES users(id)
//                 ON DELETE CASCADE
//         )
//     `);
//     // ================= SESSION =================
//     await db.execute(`
//         CREATE TABLE IF NOT EXISTS user_sessions (
//             id TEXT PRIMARY KEY,
//             user_id TEXT NOT NULL,
//             refresh_token TEXT NOT NULL,
//             access_token TEXT NOT NULL,
//             device_name TEXT,
//             device_type TEXT,
//             expires_at DATETIME,
//             created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//             FOREIGN KEY (user_id)
//                 REFERENCES users(id)
//                 ON DELETE CASCADE
//         )
//     `);
//     // ================= USER =================
//     await db.execute(`
//         CREATE TABLE IF NOT EXISTS users (
//             id TEXT PRIMARY KEY,
//             parent_id TEXT,
//             name TEXT NOT NULL,
//             email TEXT UNIQUE NOT NULL,
//             password TEXT,
//             role TEXT DEFAULT 'user',
//             is_owner INTEGER DEFAULT 0,
//             timezone TEXT DEFAULT 'UTC',
//             created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//             FOREIGN KEY (parent_id)
//                 REFERENCES users(id)
//                 ON DELETE CASCADE
//         )
//     `);
//     // ================= ROOMS =================

//     await db.execute(`
//         CREATE TABLE IF NOT EXISTS rooms (
//             id TEXT PRIMARY KEY,
//             name TEXT NOT NULL,
//             note TEXT,
//             created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//         )
//     `);

//     // ================= DEVICES =================

//     // ================= DEVICES =================
//     await db.execute(`
//         CREATE TABLE IF NOT EXISTS devices (
//             id TEXT PRIMARY KEY,
//             room_id TEXT NOT NULL,
//             parent_id TEXT,
//             name TEXT NOT NULL,
//             status TEXT,
//             type TEXT,
//             serial TEXT UNIQUE,
//             brand TEXT,
//             created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

//             FOREIGN KEY (room_id)
//                 REFERENCES rooms(id)
//                 ON DELETE CASCADE,

//             FOREIGN KEY (parent_id)
//                 REFERENCES devices(id)
//                 ON DELETE SET NULL
//         )
//     `);
//     // ================= CONFIGS (TIMER / SCHEDULE) =================
//     await db.execute(`
//         CREATE TABLE IF NOT EXISTS configs (
//             id TEXT PRIMARY KEY,
//             name TEXT,
//             config_type TEXT NOT NULL,
//             device_id TEXT NOT NULL,
//             device_type TEXT NOT NULL,

//             power TEXT NOT NULL,

//             trigger_time TEXT NOT NULL,
//             days_of_week TEXT NOT NULL,

//             duration_minutes INTEGER,
//             action TEXT,

//             is_active INTEGER DEFAULT 1,
//             created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

//             FOREIGN KEY (device_id)
//                 REFERENCES devices(id)
//                 ON DELETE CASCADE
//         )
//     `);
//     // ================= AUTOMATIONS (KỊCH BẢN TỰ ĐỘNG) =================
//     await db.execute(`
//         CREATE TABLE IF NOT EXISTS automations (
//             id TEXT PRIMARY KEY,
//             room_id TEXT NOT NULL,
//             name TEXT NOT NULL,

//             -- ĐIỀU KIỆN (NẾU)
//             trigger_config TEXT NOT NULL, -- Lưu JSON: {"type": "temperature", "operator": ">", "value": 28}

//             -- HÀNH ĐỘNG (THÌ)
//             device_id TEXT NOT NULL,      -- ID thiết bị cần điều khiển
//             action TEXT NOT NULL,         -- Lưu JSON hành động: {"type":"power","value":"ON","label":"Bật máy lạnh daikin"}

//             is_active INTEGER DEFAULT 1,
//             created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

//             FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
//             FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
//         )
//     `);
// }
import { getDB } from ".";

// src/database/init.ts
export async function initDB() {
    const db = await getDB();

    // CHÚ Ý: Bật Foreign Key hỗ trợ trên SQLite (nếu bạn đang dùng SQLite)
    await db.execute(`PRAGMA foreign_keys = ON;`);

    // ================= 1. USER (Đưa lên đầu vì các bảng khác tham chiếu tới) =================
    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            parent_id TEXT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            role TEXT DEFAULT 'user',
            is_owner INTEGER DEFAULT 0,
            timezone TEXT DEFAULT 'UTC',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // ================= 2. ROOMS =================
    await db.execute(`
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // ================= 3. ROOM_PERMISSION =================
    await db.execute(`
        CREATE TABLE IF NOT EXISTS room_permissions (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            can_view INTEGER DEFAULT 1,
            can_control INTEGER DEFAULT 0,
            can_edit INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // ================= 4. IR_BRANDS (QUẢN LÝ THƯƠNG HIỆU - NEW) =================
    // Bảng này lưu danh sách các hãng (Samsung, Daikin, Panasonic, v.v.) và phân loại thiết bị (TV, AC, FAN).
    await db.execute(`
        CREATE TABLE IF NOT EXISTS ir_brands (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,                 -- Ví dụ: "Samsung", "Daikin"
            device_type TEXT NOT NULL,          -- Loại thiết bị: "TV", "AC", "FAN", "CUSTOM"...
            is_community INTEGER DEFAULT 0,     -- 0: Hệ thống nạp sẵn, 1: Do người dùng đóng góp tự học
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // ================= 5. IR_TEMPLATES (KHO LƯU CHỨA MÃ LỆNH MẪU - NEW) =================
    // Bảng này lưu trữ cấu trúc các nút bấm đã được học hoặc định nghĩa sẵn.
    // Dữ liệu nút bấm lưu dạng JSON chuỗi gọn gàng như chúng ta đã thiết kế để gánh cả HEX lẫn RAW.
    await db.execute(`
        CREATE TABLE IF NOT EXISTS ir_templates (
            id TEXT PRIMARY KEY,
            brand_id TEXT NOT NULL,
            name TEXT NOT NULL,                 -- Tên bộ mã (Ví dụ: "Mẫu TV đời 2026", "Mã Quạt Nội Địa X")

            -- Cột chứa toàn bộ chức năng (nút bấm) dưới dạng cấu trúc JSON
            -- Ví dụ: {"power": {"protocol":3, "bits":32, "hex":"0x00FF38C7", "raw":null}, "vol_up": {...}}
            commands_json TEXT NOT NULL,

            created_by TEXT,                    -- ID của user tạo ra bộ mã này (null nếu là hệ thống mặc định)
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (brand_id) REFERENCES ir_brands(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )
    `);

    // ================= 6. DEVICES (CẬP NHẬT KẾT NỐI IR - UPGRADED) =================
    // Bổ sung thêm trường `ir_template_id` để biết thiết bị hồng ngoại này đang dùng bộ nút bấm mẫu nào.
    await db.execute(`
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            parent_id TEXT,
            name TEXT NOT NULL,
            status TEXT,
            type TEXT,                          -- "IR_EMITTER" (Mạch phát), hoặc đồng bộ theo loại thiết bị
            serial TEXT UNIQUE,
            brand TEXT,                         -- Tên hãng hiển thị nhanh bên ngoài

            ir_template_id TEXT,                -- Khóa ngoại liên kết tới kho lệnh mẫu hồng ngoại (Có thể null nếu là công tắc thường)

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_id) REFERENCES devices(id) ON DELETE SET NULL,
            FOREIGN KEY (ir_template_id) REFERENCES ir_templates(id) ON DELETE SET NULL
        )
    `);

    // ================= 7. DEVICE_PERMISSION =================
    await db.execute(`
        CREATE TABLE IF NOT EXISTS device_permissions (
            id TEXT PRIMARY KEY,
            device_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            can_view INTEGER DEFAULT 1,
            can_control INTEGER DEFAULT 0,
            can_edit INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // ================= 8. SESSION =================
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
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // ================= 9. CONFIGS (TIMER / SCHEDULE) =================
    await db.execute(`
        CREATE TABLE IF NOT EXISTS configs (
            id TEXT PRIMARY KEY,
            name TEXT,
            room_id TEXT NOT NULL,
            config_type TEXT NOT NULL,
            device_id TEXT NOT NULL,
            device_type TEXT NOT NULL,
            power TEXT NOT NULL,
            trigger_time TEXT NOT NULL,
            days_of_week TEXT NOT NULL,
            duration_minutes INTEGER,
            action TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
            FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
        )
    `);

    // ================= 10. AUTOMATIONS (KỊCH BẢN TỰ ĐỘNG) =================
    await db.execute(`
        CREATE TABLE IF NOT EXISTS automations (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            name TEXT NOT NULL,
            trigger_config TEXT NOT NULL,
            deviceId TEXT NOT NULL,
            action TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
            FOREIGN KEY (deviceId) REFERENCES devices(id) ON DELETE CASCADE
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS deviceRemoteButtons (
            id VARCHAR(50) PRIMARY KEY,
            device_id VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            code_key VARCHAR(100) NOT NULL,
            icon_key VARCHAR(50) NOT NULL,
            learned BOOLEAN DEFAULT FALSE,
            data_base64 TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}
