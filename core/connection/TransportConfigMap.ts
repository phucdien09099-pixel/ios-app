// ==========================================
// THIẾT LẬP HỆ THỐNG KIỂU DỮ LIỆU CHUẨN HÓA
// ==========================================
export interface BleDeviceConfig {
    deviceId: string; // MAC ADDRESS / UUID biệt lập của từng con
    name?: string;
}

export interface BleConfig {
    devices: BleDeviceConfig[]; // Thay đổi từ single sang Array
}

export interface MqttConfig {
    username?: string;
    password?: string;
    topicsToSubscribe?: { topic: string; qos: 0 | 1 | 2 }[];
}

export interface Rs485Config {
    portName: string;
    baudRate: number;
    dataBits: number;
    parity: "None" | "Odd" | "Even" | "Mark" | "Space";
    stopBits: 1 | 1.5 | 2;
    nodeId?: number;
}

// Map định nghĩa mối quan hệ giữa "Tên Giao Thức" và "Kiểu Cấu Hình" tương ứng
export interface TransportConfigMap {
    MQTT: MqttConfig;
    Bluetooth: BleConfig;
    RS485: Rs485Config; // Dễ dàng mở rộng thêm ZIGBEE: ZigbeeConfig, LORA: LoraConfig,... ở đây
}

export type TransportType = keyof TransportConfigMap;

export interface NormalizedDeviceStatus {
    id: string;
    type: "ROOM" | "DEVICE";
    deviceType?: "SMART" | "CIVIL";
    isOnline: boolean;
    roomId?: string;
    payload?: any;
    timestamp: number;
}
