import mqtt, { MqttClient } from "mqtt";
import { TransportMessage, TransportsInterface } from "../TransportsInterface";

export type MQTTConfig = {
    url: string;
    options?: any;
};
export class WebSocketTransports implements TransportsInterface {
    private client?: MqttClient;

    async scan(): Promise<any[]> {

        return new Promise(() => { });
    }
    async autoConnect(): Promise<void> {

    }
    async connect(config: MQTTConfig) {
        this.client = mqtt.connect(config.url, config.options);

        this.client.on("message", (topic, payload) => {
            this.onMessage?.({
                channel: topic,
                payload: payload.toString()
            });
        });
    }

    private onMessage?: (msg: TransportMessage) => void;

    onReceive(cb: (msg: TransportMessage) => void) {
        this.onMessage = cb;
    }

    async send(msg: TransportMessage) {
        if (!msg.channel) throw new Error("MQTT requires topic");

        this.client?.publish(
            msg.channel,
            JSON.stringify(msg.payload)
        );
    }

    subscribe(topic: string) {
        this.client?.subscribe(topic);
    }

    async disconnect() {
        this.client?.end();
    }

    isConnected() {
        return this.client?.connected ?? false;
    }
}