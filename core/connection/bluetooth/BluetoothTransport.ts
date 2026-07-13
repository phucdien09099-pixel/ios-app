import { bleService } from "@/utils/Tauri/BluetoothSerial";
import {
    TransportsInterface,
    TransportMessage,
} from "../TransportsInterface";
import { BleDevice } from "@mnlphlp/plugin-blec";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class BluetoothTransport implements TransportsInterface<{
    device: any;
    txCharacteristic: string;
    serviceUUID?: string;
}, string | Uint8Array> {
    private connected = false;

    private onReceiveCallback?: (
        msg: TransportMessage
    ) => void;

    private onErrorCallback?: (err: Error) => void;
    private connectedDevices = new Set<string>();

    // Chỉ sử dụng duy nhất 1 Characteristic cho cả 2 chiều Gửi và Nhận
    private txCharacteristic = process.env.NEXT_PUBLIC_CHAR_UUID_TX || "";

    private buffer: string = "";

    async scan(): Promise<any[]> {
        return new Promise(async (resolve) => {
            const deviceMap = new Map<string, BleDevice>();
            const timeout = 5000;

            try {
                const granted = await bleService.ensurePermissions(false);
                if (!granted) {
                    console.warn("[BLE Transport]: Chưa có quyền Bluetooth, bỏ qua BLE scan và fallback MQTT.");
                    resolve([]);
                    return;
                }

                await bleService.startScan((devices) => {
                    for (const d of devices) {
                        deviceMap.set(d.address, d);
                    }
                }, timeout);
            } catch (error) {
                console.error("[BLE Transport]: Không thể quét BLE:", error);
                resolve([]);
                return;
            }

            setTimeout(async () => {
                await bleService.stopScan().catch(() => { });
                resolve(Array.from(deviceMap.values()));
            }, timeout);
        });
    }

    async restore(config: any): Promise<void> {
        if (!config?.address) return;

        try {
            await bleService.connect(config.address, () => {
                this.connected = false;
            }, true);
            this.connected = true;
        } catch (e) {
            console.warn("BLE restore failed:", e);
            this.connected = false;
        }
    }

    async autoConnect(
        config?: {
            device: BleDevice;
            txCharacteristic: string;
            serviceUUID?: string;
        }
    ): Promise<any> {
        if (!config) {
            throw new Error("Config not found");
        }

        try {
            const deviceMap = new Map<string, BleDevice>();
            const timeout = 5000;

            const granted = await bleService.ensurePermissions(false);
            if (!granted) {
                throw new Error("Bluetooth permission is not granted");
            }

            await bleService.startScan((devices) => {
                for (const d of devices) {
                    if (!d?.address) continue;
                    deviceMap.set(d.address, d);
                }
            }, timeout);

            await new Promise((resolve) => setTimeout(resolve, timeout));
            await bleService.stopScan();

            const recognizeName = config.device.name?.toLowerCase() ?? "";
            const recognizeAddress = config.device.address?.toLowerCase() ?? "";

            const found = Array.from(deviceMap.values()).find((d) => {
                const name = d.name?.toLowerCase() ?? "";
                const address = d.address?.toLowerCase() ?? "";
                return name.includes(recognizeName) || address === recognizeAddress;
            });

            if (!found) {
                throw new Error(`Device "${config.device.name}" not found`);
            }

            if (found.rssi < -80) return;

            return await this.connect({
                ...config,
                deviceId: found.address,
            });

        } catch (err: any) {
            this.onErrorCallback?.(err);
            throw err;
        }
    }

    async connect(config: any): Promise<any> {
        try {
            console.log("[BLE Transport Config]:", config);
            if (!config || (!config.deviceId && !config.devices)) {
                throw new Error("Missing BLE config: 'deviceId' or 'devices' array is required.");
            }

            // Đồng bộ gán khóa đặc tính duy nhất
            this.txCharacteristic = config.txCharacteristic || process.env.NEXT_PUBLIC_CHAR_UUID_TX!;

            if (config.serviceUUID || process.env.NEXT_PUBLIC_SERVICE_UUID) {
                bleService.setService(config.serviceUUID || process.env.NEXT_PUBLIC_SERVICE_UUID!);
            }

            const granted = await bleService.ensurePermissions(false);
            if (!granted) {
                throw new Error("Bluetooth permission is not granted");
            }

            const targetDevices: any[] = config.devices
                ? config.devices
                : [{ deviceId: config.deviceId }];

            const connectionPromises = targetDevices.map(async (device) => {
                const id = device.deviceId;
                if (!id) return;

                try {
                    console.log(`[BLE Transport]: Kết nối tới thiết bị: ${id}`);

                    await bleService.connect(id, () => {
                        console.warn(`[BLE Transport]: Thiết bị ${id} ngắt kết nối.`);
                        this.connectedDevices.delete(id);
                        if (this.connectedDevices.size === 0) {
                            this.connected = false;
                        }
                        this.onErrorCallback?.(new Error(`Device ${id} disconnected.`));
                    }, true);

                    // Khắc phục lỗi HRESULT 0x80000013 bằng cách chờ Driver OS ổn định
                    await sleep(300);

                    this.connectedDevices.add(id);
                    this.connected = true;

                    try {
                        await bleService.unsubscribe(this.txCharacteristic).catch(() => { });
                    } catch { }

                    console.log(`[BLE Transport]: Lắng nghe tin báo về trên cổng: ${this.txCharacteristic}`);

                    // Đăng ký nhận tin nhắn Notify đổ về từ chính cổng này
                    await bleService.subscribeString(
                        this.txCharacteristic,
                        (data: string) => {
                            this.handleIncoming(data);
                        }
                    );

                } catch (deviceErr: any) {
                    console.error(`[BLE Transport]: Lỗi kết nối thiết bị [${id}]:`, deviceErr);
                    this.connectedDevices.delete(id);
                    if (this.connectedDevices.size === 0) {
                        this.connected = false;
                    }
                    await bleService.disconnect().catch(() => { });
                }
            });

            await Promise.all(connectionPromises);
            return config.devices || config.device;
        } catch (err: any) {
            this.connected = false;
            this.onErrorCallback?.(err);
            throw err;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await bleService.unsubscribe(this.txCharacteristic).catch(() => { });
            await bleService.disconnect();
        } catch (e) {
            console.error("[BLE Transport]: Lỗi khi hủy kết nối:", e);
        } finally {
            this.connectedDevices.clear();
            this.connected = false;
        }
    }

    isConnected(): boolean {
        return this.connected;
    }

    // =========================================================
    // SEND (Đã chuyển sang bắn thẳng dữ liệu lệnh vào txCharacteristic)
    // =========================================================
    async send(message: TransportMessage): Promise<any> {
        if (!this.connected) {
            throw new Error("BLE not connected");
        }

        const topic = message.channel || "";
        const payload =
            typeof message.payload === "string"
                ? message.payload
                : JSON.stringify(message.payload);

        const packet = `${topic}|${payload}`;

        // Khi dùng chung 1 kênh, Client ghi (Write) trực tiếp vào txCharacteristic
        await bleService.sendString(
            this.txCharacteristic,
            packet,
            "withoutResponse"
        );
    }

    private handleIncoming(data: string) {
        try {
            this.buffer = data;
            const parsed = this.parseMessage(this.buffer);
            console.log("[BLE Transport Parsed]:", parsed);

            this.onReceiveCallback?.(parsed);
        } catch (err: any) {
            this.onErrorCallback?.(err);
        }
    }

    private parseMessage(raw: string): TransportMessage {
        const sep = raw.indexOf("|");
        if (sep === -1) return {} as TransportMessage;

        const channel = raw.slice(0, sep);
        const payloadRaw = raw.slice(sep + 1);

        let payload: any = payloadRaw;

        try {
            payload = JSON.parse(payloadRaw);
        } catch { }
        return {
            channel,
            payload,
        };
    }

    async subscribe(topic: string, qos: number = 0) { }

    onReceive(cb: (msg: TransportMessage) => void): void {
        this.onReceiveCallback = cb;
    }

    onError(callback: (err: Error) => void): void {
        this.onErrorCallback = callback;
    }
}
