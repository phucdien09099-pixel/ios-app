import { bleService } from "@/utils/Tauri/BluetoothSerial";
import {
    TransportsInterface,
    TransportMessage,
} from "../TransportsInterface";
import { BleDevice } from "@mnlphlp/plugin-blec";

export class BluetoothTransport implements TransportsInterface<{
    device: any;
    txCharacteristic: string;
    rxCharacteristic: string;
    serviceUUID?: string;
}, string | Uint8Array> {
    private connected = false;

    private onReceiveCallback?: (
        msg: TransportMessage
    ) => void;

    private onErrorCallback?: (err: Error) => void;

    private txCharacteristic = "";
    private rxCharacteristic = "";

    private buffer: string = "";

    async scan(): Promise<any[]> {
        return new Promise(async (resolve) => {
            const deviceMap = new Map<
                string,
                BleDevice
            >();

            const timeout = 5000;

            await bleService.startScan((devices) => {
                for (const d of devices) {
                    deviceMap.set(d.address, d);
                }
            }, timeout);

            setTimeout(async () => {
                await bleService.stopScan();
                resolve(
                    Array.from(deviceMap.values())
                );
            }, timeout);
        });
    }

    async restore(config: any): Promise<void> {
        if (!config?.address) return;

        try {
            await bleService.connect(config.address, () => {
                this.connected = false;
            }, true);

        } catch (e) {
            console.warn("BLE restore failed:", e);
        }
    }
    async autoConnect(
        config?: {
            device: BleDevice;
            txCharacteristic: string;
            rxCharacteristic: string;
            serviceUUID?: string;
        }
    ): Promise<any> {
        if (!config) {
            throw new Error("Config not found");
        }

        try {
            const deviceMap = new Map<string, BleDevice>();

            const timeout = 5000;

            // start scan
            await bleService.startScan((devices) => {
                for (const d of devices) {
                    if (!d?.address) continue;

                    deviceMap.set(d.address, d);
                }
            }, timeout);

            // wait scan finish
            await new Promise((resolve) =>
                setTimeout(resolve, timeout)
            );

            await bleService.stopScan();

            const recognizeName =
                config.device.name?.toLowerCase() ?? "";

            const recognizeAddress =
                config.device.address?.toLowerCase() ?? "";

            // find matched device
            const found = Array.from(deviceMap.values()).find((d) => {
                const name = d.name?.toLowerCase() ?? "";
                const address = d.address?.toLowerCase() ?? "";

                // console.log("Recognize:", recognizeName);
                // console.log("Scan Name:", name);

                return (
                    name.includes(recognizeName) ||
                    address === recognizeAddress
                );
            });

            if (!found) {
                throw new Error(
                    `Device "${config.device.name}" not found`
                );
            }

            // console.log("Auto connect device:", found);

            // weak signal
            if (found.rssi < -80) {
                // console.warn(
                //     `RSSI too weak: ${found.rssi}`
                // );
                return;
            }

            // reconnect
            return await this.connect({
                ...config,
                device: found,
            });;

        } catch (err: any) {
            this.onErrorCallback?.(err);
            throw err;
        }
    }
    async connect(config?: {
        device: BleDevice;
        txCharacteristic: string;
        rxCharacteristic: string;
        serviceUUID?: string;
    }): Promise<any> {
        try {
            if (!config) {
                throw new Error(
                    "Missing BLE config"
                );
            }
            // console.log(config)

            this.txCharacteristic = config.txCharacteristic;
            this.rxCharacteristic = config.rxCharacteristic;

            // set service if provided
            if (config.serviceUUID) {
                bleService.setService(config.serviceUUID);
            }
            if (this.connected) bleService.disconnect();

            await bleService.connect(config.device, () => {
                this.connected = false;
            }, true);
            // console.log(this.connected)

            this.connected = true;

            // subscribe RX (from ESP32 → client)
            await bleService.subscribeString(
                this.txCharacteristic,
                (data: string) => {
                    this.handleIncoming(data);
                }
            );
            // console.log(config.device)
            return config.device;
        } catch (err: any) {
            this.onErrorCallback?.(err);
            throw err;
        }
    }

    // =========================
    // DISCONNECT
    // =========================
    async disconnect(): Promise<void> {
        await bleService.disconnect();
        this.connected = false;
    }

    // =========================
    // STATUS
    // =========================
    isConnected(): boolean {
        return this.connected;
    }

    // =========================
    // SEND (MQTT style)
    // =========================
    async send(message: TransportMessage): Promise<any> {
        if (!this.connected) {
            throw new Error(
                "BLE not connected"
            );
        }

        const topic = message.channel || "";
        const payload =
            typeof message.payload === "string"
                ? message.payload
                : JSON.stringify(message.payload);

        const packet = `${topic}|${payload}`;
        await bleService.sendString(
            this.txCharacteristic,
            packet,
            "withoutResponse"
        );
    }

    // =========================
    // RECEIVE HANDLER
    // =========================
    private handleIncoming(data: string) {
        try {
            // support fragmented BLE packets
            this.buffer = data;
            console.log(this.buffer)
            // assume full message per line
            const parsed = this.parseMessage(this.buffer)
            console.log(parsed)

            this.onReceiveCallback?.(
                parsed
            );
        } catch (err: any) {
            this.onErrorCallback?.(err);
        }
    }

    // =========================
    // PARSE topic|payload
    // =========================
    private parseMessage(raw: string): TransportMessage {
        const sep = raw.indexOf("|");
        if (sep === -1) return {} as TransportMessage;

        const channel = raw.slice(0, sep);
        const payloadRaw = raw.slice(sep + 1);

        let payload: any = payloadRaw;

        // try parse JSON
        try {
            payload = JSON.parse(payloadRaw);
        } catch {
            // keep string
        }
        return {
            channel,
            payload,
        };
    }

    // =========================
    // CALLBACKS
    // =========================
    onReceive(
        cb: (msg: TransportMessage) => void
    ): void {
        this.onReceiveCallback = cb;
    }

    onError(
        callback: (err: Error) => void
    ): void {
        this.onErrorCallback = callback;
    }
}
