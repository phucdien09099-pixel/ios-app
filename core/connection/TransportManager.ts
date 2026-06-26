import { ConnectionStatus } from "./connections";
import { MqttConfig } from "./mqtt/MqttTransport";
import { TransportConfigMap, TransportType } from "./TransportConfigMap";
import { createConnection } from "./TransportConnections";
import { TransportMessage, TransportsInterface } from "./TransportsInterface";

export interface BleConfig {
    deviceId: string; // Tương đương MAC ADDRESS
}

export interface Rs485Config {
    portName: string;
    baudRate: number;
    dataBits: number;
    parity: "None" | "Odd" | "Even" | "Mark" | "Space";
    stopBits: 1 | 1.5 | 2;
    nodeId?: number;
}

class TransportManager {
    // Quản lý danh sách các Driver Transport
    private transports = new Map<TransportType, TransportsInterface>();
    private configs = new Map<TransportType, any>();

    // Trạng thái kết nối riêng biệt cho từng cổng mạng
    private connectionStatuses = new Map<TransportType, ConnectionStatus>();

    private STORAGE_KEY = "vdtas_hybrid_config";
    private lastUpdatedMap = new Map<string, number>();

    // Callbacks cho UI lắng nghe
    private globalReceiveCallback: ((msg: any) => void) | null = null;
    private statusCallback: ((status: Map<TransportType, ConnectionStatus>) => void) | null = null;

    private lastSeenMap = new Map<string, number>();
    private heartbeatTimeout = 15000;
    private deadmanTimerId: NodeJS.Timeout | null = null;

    constructor() {
        // Khởi tạo sẵn cả 2 driver phần cứng mạng
        const availableProtocols: TransportType[] = ["MQTT", "Bluetooth"];

        for (const protocol of availableProtocols) {
            const transportInstance = createConnection(protocol as any);
            if (transportInstance) {
                this.transports.set(protocol, transportInstance);
                this.connectionStatuses.set(protocol, "idle");
            }
        }
    }

    private startHeartbeatMonitor() {
        if (this.deadmanTimerId) clearInterval(this.deadmanTimerId);

        this.deadmanTimerId = setInterval(() => {
            const now = Date.now();
            for (const [entityId, lastSeenTime] of this.lastSeenMap.entries()) {
                if (now - lastSeenTime > this.heartbeatTimeout) {
                    this.lastSeenMap.delete(entityId);
                    const [type, id] = entityId.split("_");

                    const offlineData: any = {
                        id: id,
                        type: type as "ROOM" | "DEVICE",
                        isOnline: false,
                        timestamp: now,
                    };

                    if (this.globalReceiveCallback) {
                        this.globalReceiveCallback(offlineData);
                    }
                }
            }
        }, 5000);
    }

    // ==========================================
    // 1. KẾT NỐI SONG SONG TẤT CẢ CÁC CỔNG MẠNG
    // ==========================================
    public async connectDual(configs: Partial<TransportConfigMap>) {
        this.startHeartbeatMonitor();

        // Lưu trữ và cache cấu hình
        Object.entries(configs).forEach(([key, cfg]) => {
            this.configs.set(key as TransportType, cfg);
        });

        // if (typeof window !== "undefined") {
        //     localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
        // }

        // Đăng ký nhận tin & xử lý tái kết nối tự động cho từng cổng độc lập
        const connectTasks: Promise<boolean>[] = [];

        this.transports.forEach((transport, type) => {
            const config = configs[type];
            if (!config) return;

            // Đăng ký luồng dữ liệu nhận vào (Cả 2 cổng đều đẩy về một cổng xử lý tập trung)
            transport.onReceive((msg) => this.handleIncomingRawData(msg, type));

            // Xử lý khi có lỗi xảy ra trên luồng mạng: kích hoạt cơ chế tự động reconnect định kỳ
            transport.onError?.(async (err) => {
                console.warn(`[Transport Manager]: Cổng [${type}] bị mất kết nối:`, err);
                this.updateStatus(type, "error");
                this.startSingleReconnectionLoop(type);
            });

            // Tiến hành kích hoạt kết nối song song (Không chặn block nhau)
            connectTasks.push(this.connectSingleTransport(type, config));
        });

        const results = await Promise.all(connectTasks);
        if (results.length > 0 && results.every((connected) => !connected)) {
            throw new Error("[Transport Manager]: Không thể kết nối bất kỳ cổng mạng nào.");
        }
    }

    // Hàm thực hiện kết nối độc lập cho một transport cụ thể
    private async connectSingleTransport(type: TransportType, config: any): Promise<boolean> {
        const transport = this.transports.get(type);
        if (!transport) return false;

        try {
            this.updateStatus(type, "connecting");
            console.log(`[Transport Manager]: Đang kết nối tới cổng [${type}]...`);
            await transport.connect(config);

            this.updateStatus(type, "connected");
            console.log(`[Transport Manager]: Cổng [${type}] đã thông suốt và sẵn sàng.`);
            return true;
        } catch (error) {
            console.error(`[Transport Manager]: Không thể kết nối tới cổng [${type}]:`, error);
            this.updateStatus(type, "error");
            // Kích hoạt vòng lặp tự động kết nối lại nếu lần đầu thất bại
            this.startSingleReconnectionLoop(type);
            return false;
        }
    }

    // Vòng lặp ngầm tự động tìm kiếm kết nối lại cho riêng từng cổng khi sập mạng
    private startSingleReconnectionLoop(type: TransportType) {
        const transport = this.transports.get(type);
        const config = this.configs.get(type);

        if (!transport || !config) return;

        // Cơ chế Exponential Backoff hoặc cố định khoảng thời gian (ở đây để tạm 10s)
        const intervalId = setInterval(async () => {
            if (transport.isConnected()) {
                this.updateStatus(type, "connected");
                clearInterval(intervalId);
                return;
            }

            try {
                console.log(`[Reconnector]: Thử kết nối lại cổng [${type}]...`);
                await transport.connect(config);
                if (transport.isConnected()) {
                    this.updateStatus(type, "connected");
                    console.log(`[Reconnector]: Khôi phục cổng [${type}] thành công.`);
                    clearInterval(intervalId);
                }
            } catch {
                // Tiếp tục duy trì vòng lặp nếu chưa kết nối lại được
            }
        }, 10000);
    }

    // ==========================================
    // 3. ĐỒNG BỘ DỮ LIỆU & BỘ LỌC CHỐNG TRÙNG TIN
    // ==========================================
    private handleIncomingRawData(msg: any, source: TransportType) {
        // Vì nhận song song từ cả MQTT và BLE, gói tin trùng lặp gửi về là bình thường.
        // Hệ thống sẽ dựa vào `lastUpdatedMap` (timestamp) bên dưới để loại bỏ tin cũ / tin trùng.

        const topic = msg.channel || "/";
        const rawPayload = typeof msg.payload === "string" ? msg.payload.trim() : "";

        if (rawPayload !== "ping" && rawPayload !== "online") {
            // Nếu là dữ liệu điều khiển thông thường, vẫn cho qua hoặc xử lý theo nhu cầu của bạn
            if (this.globalReceiveCallback) this.globalReceiveCallback(msg);
            return;
        }

        const topicParts = topic.split("/");
        if (topicParts.length < 3) return;

        const isUserDeviceTopic = topicParts[0] === "users" && topicParts[2] === "devices";
        const entityType = "DEVICE";
        const entityId = isUserDeviceTopic ? topicParts[3] : topicParts[1];
        if (!entityId) return;

        const uniqueEntityId = `${entityType}_${entityId}`;
        const currentTimestamp = Date.now();

        // Chống lặp tin nhận trùng lặp từ cả 2 kênh bằng Timestamp vật lý
        const lastUpdated = this.lastUpdatedMap.get(uniqueEntityId) || 0;
        if (currentTimestamp <= lastUpdated) return;

        this.lastUpdatedMap.set(uniqueEntityId, currentTimestamp);
        this.lastSeenMap.set(uniqueEntityId, currentTimestamp);

        if (this.globalReceiveCallback) {
            this.globalReceiveCallback(msg);
        }
    }

    // ==========================================
    // 4. API TƯƠNG TÁC RA FRONTEND UI
    // ==========================================
    public onNormalizedReceive(callback: (data: any) => void) {
        this.globalReceiveCallback = callback;
    }

    // Thay đổi cấu trúc trả về map trạng thái cho UI để hiển thị chi tiết icon MQTT hay BLE đang On/Off
    public onStatusChange(callback: (statusMap: Map<TransportType, ConnectionStatus>) => void) {
        this.statusCallback = callback;
    }

    private updateStatus(type: TransportType, status: ConnectionStatus) {
        this.connectionStatuses.set(type, status);
        if (this.statusCallback) this.statusCallback(new Map(this.connectionStatuses));
    }

    /**
     * Gửi dữ liệu ra thiết bị
     * Bạn có thể tùy biến chiến lược gửi:
     * - Chiến lược 1: Gửi qua cổng Bluetooth trước nếu online (Tốc độ phản hồi cục bộ nhanh), nếu sập thì gửi qua MQTT.
     * - Chiến lược 2: Broadcast (Gửi đồng thời trên cả 2 kênh đang online).
     */
    public async send(data: any, channel: string, strategy: "smart" | "broadcast" = "smart") {
        const mqtt = this.transports.get("MQTT");
        const ble = this.transports.get("Bluetooth");

        const isBleConnected = ble?.isConnected() ?? false;
        const isMqttConnected = mqtt?.isConnected() ?? false;

        if (!isBleConnected && !isMqttConnected) {
            throw new Error(`[Hybrid Engine]: Toàn bộ các kênh mạng (MQTT, BLE) đều đang ngoại tuyến.`);
        }

        const payload = { channel, payload: data };
        if (strategy === "broadcast") {
            // Gửi đồng thời lên cả 2 kênh
            const promises: Promise<any>[] = [];
            if (isBleConnected) promises.push(ble!.send(payload));
            if (isMqttConnected) promises.push(mqtt!.send(payload));
            return Promise.all(promises);
        } else {
            // Chiến lược thông minh: Ưu tiên BLE (Cục bộ không delay), fallback sang MQTT
            if (isBleConnected) {
                return ble!.send(payload);
            }
            return mqtt!.send(payload);
        }
    }

    public subscribe(topic: string) {
        // Đăng ký subscribe topic trên tất cả các kênh đang chạy để đón đầu dữ liệu
        this.transports.forEach((transport) => {
            if (transport.isConnected()) {
                transport.subscribe(topic);
            }
        });
    }

    public async disconnect() {
        if (this.deadmanTimerId) {
            clearInterval(this.deadmanTimerId);
            this.deadmanTimerId = null;
        }
        this.lastSeenMap.clear();

        this.transports.forEach((_, type) => this.updateStatus(type, "disconnected"));

        const disconnectPromises: Promise<void>[] = [];
        this.transports.forEach((transport) => {
            disconnectPromises.push(transport.disconnect());
        });
        await Promise.all(disconnectPromises);
    }

    // Các hàm kiểm tra trạng thái
    public getStatuses(): Map<TransportType, ConnectionStatus> { return this.connectionStatuses; }

    public isConnected(type?: TransportType): boolean {
        if (type) {
            return this.transports.get(type)?.isConnected() ?? false;
        }
        // Trả về true nếu ít nhất một trong các cổng mạng thông suốt
        return Array.from(this.transports.values()).some(t => t.isConnected());
    }

    public async scan(targetTransport: TransportType = "Bluetooth"): Promise<any[]> {
        const transport = this.transports.get(targetTransport);
        if (!transport) return [];
        return transport.scan?.() ?? [];
    }
}

export const transportManager = new TransportManager();
