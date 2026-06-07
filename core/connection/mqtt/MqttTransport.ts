import { connect, disconnect, publish, subscribe, unsubscribe, listen } from "@kuyoonjo/tauri-plugin-mqtt";
import { invoke } from "@tauri-apps/api/core"; // Thêm invoke để gọi xuống Rust
import { TransportMessage, TransportsInterface } from "../TransportsInterface";

export interface MqttConfig {
    brokerUrl?: string; // Chuyển thành optional vì ta sẽ lấy từ Rust nếu không truyền
    username?: string;  // Nhận tài khoản từ UI nhập vào
    password?: string;  // Nhận mật khẩu từ UI nhập vào
    topicsToSubscribe?: { topic: string; qos: 0 | 1 | 2 }[];
}

export class MqttTransport implements TransportsInterface<MqttConfig, string> {
    private connectionId: string;
    private connected: boolean = false;
    private unlistenFn: (() => void) | null = null;

    private receiveCallback: ((msg: TransportMessage) => void) | null = null;
    private errorCallback: ((err: Error) => void) | null = null;
    private savedConfig: MqttConfig | null = null;

    constructor(connectionId: string = "default-mqtt-client") {
        this.connectionId = connectionId;
    }

    async connect(config?: MqttConfig): Promise<any> {
        if (!config) {
            throw new Error("MqttConfig is required to connect.");
        }
        this.savedConfig = config;

        try {
            let finalBrokerUrl = config.brokerUrl;

            // Nếu không truyền cứng brokerUrl, tiến hành gọi lệnh Rust để sinh URL bảo mật từ file .env
            if (!finalBrokerUrl) {
                finalBrokerUrl = await invoke<string>("get_mqtt_config", {
                    username: config.username || null,
                    password: config.password || null
                });
            }

            // 1. Kết nối sử dụng Broker URL bảo mật vừa lấy được
            await connect(this.connectionId, finalBrokerUrl, undefined);
            this.connected = true;

            // 2. Lắng nghe event toàn cục từ Tauri MQTT Plugin nếu chưa khởi tạo
            if (!this.unlistenFn) {
                this.unlistenFn = await listen((event: any) => {
                    this.handleIncomingEvent(event);
                });
            }

            // 3. Tự động subscribe các topic đã khai báo sẵn trong config
            if (config.topicsToSubscribe && config.topicsToSubscribe.length > 0) {
                for (const item of config.topicsToSubscribe) {
                    await subscribe(this.connectionId, item.topic, item.qos);
                }
            }

            return { status: "success", id: this.connectionId };
        } catch (error: any) {
            this.connected = false;
            if (this.errorCallback) this.errorCallback(new Error(error));
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.savedConfig?.topicsToSubscribe) {
                for (const item of this.savedConfig.topicsToSubscribe) {
                    await unsubscribe(this.connectionId, item.topic);
                }
            }

            await disconnect(this.connectionId);
            this.connected = false;

            if (this.unlistenFn) {
                this.unlistenFn();
                this.unlistenFn = null;
            }
        } catch (error) {
            console.error("MQTT disconnect error:", error);
        }
    }

    async subscribe(topic: string): Promise<void> {
        if (!this.connected) throw new Error("MQTT client is not connected.");
        await subscribe(this.connectionId, topic, 0);
    }

    isConnected(): boolean {
        return this.connected;
    }

    async send(message: TransportMessage): Promise<any> {
        if (!this.connected) throw new Error("MQTT client is not connected.");
        if (!message.channel) throw new Error("MQTT message requires a topic (channel).");

        const qos = 0;
        const retain = false;

        const stringPayload = typeof message.payload === 'object'
            ? JSON.stringify(message.payload)
            : String(message.payload);

        return await publish(this.connectionId, message.channel, qos, retain, stringPayload);
    }

    onReceive(cb: (msg: TransportMessage) => void): void {
        this.receiveCallback = cb;
    }

    onError(callback: (err: Error) => void): void {
        this.errorCallback = callback;
    }

    async scan(): Promise<string[]> {
        return this.savedConfig?.topicsToSubscribe?.map(t => t.topic) || [];
    }

    private handleIncomingEvent(rawEvent: any) {
        if (!rawEvent || rawEvent.payload?.id !== this.connectionId) return;

        const eventData = rawEvent.payload?.event;
        if (!eventData) return;

        if (eventData.message && this.receiveCallback) {
            const { topic, payload } = eventData.message;
            let parsedPayload = payload;
            try {
                if (Array.isArray(payload)) {
                    parsedPayload = new TextDecoder().decode(new Uint8Array(payload));
                }
                parsedPayload = JSON.parse(parsedPayload);
            } catch {
                // Giữ nguyên chuỗi thô nếu không phải JSON
            }

            this.receiveCallback({
                channel: topic,
                payload: parsedPayload
            });
        }

        if (eventData.disconnect && this.errorCallback) {
            this.connected = false;
            this.errorCallback(new Error("MQTT disconnected from broker unexpectedly."));
        }
    }
}
