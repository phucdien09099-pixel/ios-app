import { createConnection } from "./TransportConnections";
import { TransportMessage, TransportsInterface } from "./TransportsInterface";
import { MqttTransportInterface } from "./mqtt/MqttTransportInterface";
import { ConnectionType } from "./connections";

class TransportManager {
    private connection: TransportsInterface | null = null;
    private type: ConnectionType | null = null;

    private STORAGE_KEY = "myluvskadii";

    // =========================
    // CREATE / SET CONNECTION
    // =========================
    public init(type: ConnectionType) {
        this.connection = createConnection(type);
        this.type = type;
        return this.connection;
    }
    // =========================
    // AUTO CONNECT
    // =========================
    async autoConnect() {
        if (typeof window === "undefined") return;
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return;

        const { type, config } = JSON.parse(raw);
        this.connection = createConnection(type);
        this.type = type;

        if (!config?.device) {
            console.warn("No BLE device to autoConnect");
            return null;
        }

        try {

            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify({ type: this.type, config })
            );
            console.log(config)
            await this.connection.autoConnect(config);
            await this.connection.restore?.(config);

            return await this.connection.autoConnect(config);;

        } catch (err) {
            console.error("AutoConnect failed:", err);
            return null;
        }
    }

    // =========================
    // CONNECT
    // =========================
    async connect(config: any) {
        if (this.connection?.isConnected()) return;

        const conn = this.connection;
        if (!conn) throw new Error("No Connection Selected");

        // Connect first, get the actual device back
        const connectedDevice = await conn.connect(config);
        await conn.restore?.(config);

        if (typeof window !== "undefined") {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            const existing = raw ? JSON.parse(raw) : { type: this.type, config: {} };

            const savedDevices: any[] = Array.isArray(existing.config?.device)
                ? existing.config.device
                : existing.config?.device
                    ? [existing.config.device]
                    : [];

            // Use the actual connected device returned from connect()
            const deviceToSave = connectedDevice ?? config.device;

            if (deviceToSave) {
                const alreadySaved = savedDevices.some(
                    (d: any) =>
                        d.address === deviceToSave.address ||
                        d.name === deviceToSave.name
                );

                if (!alreadySaved) {
                    savedDevices.push(deviceToSave);
                } else {
                    // Update existing entry with latest data
                    const idx = savedDevices.findIndex(
                        (d: any) => d.address === deviceToSave.address
                    );
                    if (idx !== -1) savedDevices[idx] = deviceToSave;
                }
            }

            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify({
                    type: this.type,
                    config: {
                        ...config,
                        device: savedDevices,
                    },
                })
            );
        }
    }
    // =========================
    // SCAN (BLE only safe call)
    // =========================
    async scan() {
        return this.connection?.scan?.();
    }

    // =========================
    // DISCONNECT
    // =========================
    async disconnect() {
        await this.connection?.disconnect();
    }

    // =========================
    // SEND
    // =========================
    async send(data: any, channel: string) {
        if (!this.connection) throw new Error("No active connection");

        return this.connection.send({
            channel,
            payload: data,
        });
    }

    // =========================
    // MQTT SUBSCRIBE SAFE
    // =========================
    subscribe(topic: string) {
        const conn = this.connection as MqttTransportInterface;

        if (conn?.subscribe) {
            conn.subscribe(topic);
        } else {
            console.warn("Current transport does not support subscribe");
        }
    }

    // =========================
    // EVENTS
    // =========================
    onReceive(callback: (data: TransportMessage) => void) {
        this.connection?.onReceive(callback);
    }

    // =========================
    // GETTERS
    // =========================
    getConnection() {
        return this.connection;
    }

    getType() {
        return this.type;
    }

    isConnected() {
        return this.connection?.isConnected();
    }
}

export const transportManager = new TransportManager();
