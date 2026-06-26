import mqtt, { type IClientOptions, type MqttClient } from "mqtt";
import { TransportMessage, TransportsInterface } from "../TransportsInterface";

export interface MqttConfig {
    /** MQTT over WebSocket URL, for example ws://192.168.1.7:9001. */
    brokerUrl?: string;
    username?: string;
    password?: string;
    clientId?: string;
    topicsToSubscribe?: { topic: string; qos: 0 | 1 | 2 }[];
}

const getCurrentMqttUser = () => {
    if (typeof window === "undefined") return "anonymous";

    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}") as {
            accountId?: string;
            id?: string;
            email?: string;
        };

        return user.email || user.accountId || user.id || "anonymous";
    } catch {
        return "anonymous";
    }
};

const MQTT_USER = process.env.NEXT_PUBLIC_MQTT_USER || "iot@gmail.com";
const MQTT_PASS = process.env.NEXT_PUBLIC_MQTT_PASS || "vdtasoo12";

const toUserDeviceTopic = (topic: string) => {
    if (topic.startsWith("users/")) return topic;

    const parts = topic.split("/");
    if (parts[0] !== "device" || !parts[1]) return topic;

    const user = getCurrentMqttUser();
    const device = parts[1];
    const suffix = parts.slice(2).join("/");

    if (suffix === "sensor/info") {
        return `users/${user}/devices/${device}/sensor/info`;
    }

    if (suffix === "sensor") {
        return `users/${user}/devices/${device}/sensor`;
    }

    if (suffix === "info") {
        return `users/${user}/devices/${device}/info`;
    }

    if (suffix === "status") {
        return `users/${user}/devices/${device}/status`;
    }

    return `users/${user}/devices/${device}/${suffix}`;
};

export class MqttTransport implements TransportsInterface<MqttConfig, string> {
    private client: MqttClient | null = null;
    private connected = false;
    private connecting: Promise<void> | null = null;
    private receiveCallback: ((msg: TransportMessage) => void) | null = null;
    private errorCallback: ((err: Error) => void) | null = null;
    private savedConfig: MqttConfig | null = null;

    constructor(private readonly connectionId: string = "default-mqtt-client") { }

    async connect(config?: MqttConfig): Promise<{ status: "success"; id: string }> {
        if (!config) throw new Error("MqttConfig is required to connect.");
        if (this.connected && this.client?.connected) {
            return { status: "success", id: this.connectionId };
        }
        if (this.connecting) {
            await this.connecting;
            return { status: "success", id: this.connectionId };
        }

        const brokerUrl = config.brokerUrl ?? process.env.NEXT_PUBLIC_MQTT_URL;
        if (!brokerUrl) {
            throw new Error(
                "Missing MQTT WebSocket URL. Set NEXT_PUBLIC_MQTT_URL (for example ws://192.168.1.7:9001)."
            );
        }
        if (!/^wss?:\/\//i.test(brokerUrl)) {
            throw new Error("Frontend MQTT requires a ws:// or wss:// broker URL.");
        }

        this.savedConfig = config;
        const options: IClientOptions = {
            clientId: config.clientId ?? `${this.connectionId}-${crypto.randomUUID()}`,
            username: config.username ?? MQTT_USER,
            password: config.password ?? MQTT_PASS,
            clean: true,
            // TransportManager owns the retry loop, so MQTT.js must not create a second one.
            reconnectPeriod: 0,
            connectTimeout: 10_000,
        };

        const client = mqtt.connect(brokerUrl, options);
        this.client = client;
        this.bindClientEvents(client);

        this.connecting = new Promise<void>((resolve, reject) => {
            const cleanup = () => {
                client.off("connect", handleConnect);
                client.off("error", handleError);
            };
            const handleConnect = () => {
                cleanup();
                resolve();
            };
            const handleError = (error: Error) => {
                cleanup();
                reject(error);
            };
            client.once("connect", handleConnect);
            client.once("error", handleError);
        });

        try {
            await this.connecting;
            await this.subscribeConfiguredTopics(config);
            return { status: "success", id: this.connectionId };
        } catch (error) {
            this.connected = false;
            client.end(true);
            if (this.client === client) this.client = null;
            throw this.toError(error);
        } finally {
            this.connecting = null;
        }
    }

    async disconnect(): Promise<void> {
        const client = this.client;
        this.client = null;
        this.connected = false;
        this.connecting = null;
        if (!client) return;
        client.removeAllListeners();
        await new Promise<void>((resolve, reject) => {
            client.end(false, {}, (error) => error ? reject(error) : resolve());
        });
    }

    async subscribe(topic: string): Promise<void> {
        const client = this.requireConnectedClient();
        const mqttTopic = toUserDeviceTopic(topic);
        await new Promise<void>((resolve, reject) => {
            client.subscribe(mqttTopic, { qos: 0 }, (error) => error ? reject(error) : resolve());
        });
    }

    isConnected(): boolean {
        return this.connected && Boolean(this.client?.connected);
    }

    async send(message: TransportMessage): Promise<void> {
        if (!message.channel) throw new Error("MQTT message requires a topic (channel).");
        const client = this.requireConnectedClient();
        const topic = toUserDeviceTopic(message.channel);
        const payload = typeof message.payload === "object"
            ? JSON.stringify(message.payload)
            : String(message.payload);

        console.log("[MQTT PUBLISH]", { topic, payload: message.payload });

        await new Promise<void>((resolve, reject) => {
            client.publish(topic, payload, { qos: 0, retain: false }, (error) =>
                error ? reject(error) : resolve()
            );
        });
    }

    onReceive(cb: (msg: TransportMessage) => void): void {
        this.receiveCallback = cb;
    }

    onError(callback: (err: Error) => void): void {
        this.errorCallback = callback;
    }

    async scan(): Promise<string[]> {
        return this.savedConfig?.topicsToSubscribe?.map(({ topic }) => topic) ?? [];
    }

    private bindClientEvents(client: MqttClient): void {
        client.on("connect", () => { this.connected = true; });
        client.on("message", (topic, buffer) => {
            const rawPayload = buffer.toString();
            let payload: unknown = rawPayload;
            try {
                payload = JSON.parse(rawPayload);
            } catch {
                // Keep non-JSON payloads as text.
            }
            console.log("[MQTT RECEIVE]", { topic, payload });
            this.receiveCallback?.({ channel: topic, payload });
        });
        client.on("close", () => { this.connected = false; });
        client.on("offline", () => { this.connected = false; });
        client.on("error", (error) => {
            this.connected = false;
            this.errorCallback?.(error);
        });
    }

    private async subscribeConfiguredTopics(config: MqttConfig): Promise<void> {
        const client = this.requireConnectedClient();
        await Promise.all((config.topicsToSubscribe ?? []).map(({ topic, qos }) =>
            new Promise<void>((resolve, reject) => {
                client.subscribe(topic, { qos }, (error) => error ? reject(error) : resolve());
            })
        ));
    }

    private requireConnectedClient(): MqttClient {
        if (!this.connected || !this.client?.connected) {
            throw new Error("MQTT client is not connected.");
        }
        return this.client;
    }

    private toError(error: unknown): Error {
        return error instanceof Error ? error : new Error(String(error));
    }
}
