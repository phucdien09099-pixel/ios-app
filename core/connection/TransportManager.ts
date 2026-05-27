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

        // ⚠️ BLE RULE:
        // nếu có device → connect lại
        // nếu không → skip (không scan auto)
        if (config?.device) {
            const newDevice =
                await this.connection.autoConnect(config);

            if (newDevice) {
                config.device = newDevice;
            }

            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify({
                    type: this.type,
                    config,
                })
            );
            await this.connection.restore?.(config);
            // console.log(newDevice)
            return newDevice;
        } else {
            console.warn("No BLE device to autoConnect");
            return null;
        }
    }

    // =========================
    // CONNECT
    // =========================
    async connect(config: any) {

        if (this.connection && this.connection.isConnected()) {
            return;
        }

        // if (this.connection?.isConnected) {
        //     await this.disconnect();
        // }

        const conn = this.connection;
        if (!conn) throw new Error("No Connection Selected");

        if (typeof window !== "undefined") {
            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify({ type: this.type, config })
            );
        }



        await conn.connect(config);
        await conn.restore?.(config);
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
        this.connection = null;
        this.type = null;
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