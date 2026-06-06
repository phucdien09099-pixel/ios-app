import { closeCOM, COMProps, openCOM, readSerialUntilChar, readSerialUntilString, scanCOM, writeSerial } from "@/utils/Tauri";
import { TransportMessage, TransportsInterface } from "../TransportsInterface";

export type SerialConfig = {
    port_name: string;
    baud_rate: number;
    data_bits: number;
    parity: "None" | "Odd" | "Even" | "Mark" | "Space";
    stop_bits: 1 | 1.5 | 2;
};

export class RS458Transports implements TransportsInterface {
    private connected = false;
    private cb?: (msg: TransportMessage) => void;
    private isRunning = false;

    async scan(): Promise<any[]> {
        const ports = await scanCOM();
        return ports;
    }
    async subscribe(topic: string, qos: number = 0): Promise<void> {
        // RS485 đọc ghi trực tiếp qua Bus, không có khái niệm Broker Subscribe
        console.warn("RS485 does not support native Pub/Sub subscribe operation.");
    }
    async autoConnect(): Promise<void> {

    }

    async connect(config: SerialConfig) {
        const res = await openCOM(config);
        this.connected = res.succes;
        return res;
    }

    async send(msg: TransportMessage) {
        const res = await writeSerial(JSON.stringify(msg.payload) + "END");
        return res;
    }

    onReceive(cb: (msg: TransportMessage) => void) {
        this.cb = cb;
        this.startLoop();
    }

    private async startLoop() {
        this.isRunning = true;

        while (this.isRunning) {
            const raw = await readSerialUntilString({ delimiter: "END" });

            if (!raw) continue;

            const clean = raw.replace(/END\s*$/, "").trim();

            try {
                const parsed = JSON.parse(clean);

                this.cb?.({
                    channel: "serial",
                    payload: parsed
                });
            } catch {
                this.cb?.({
                    channel: "serial",
                    payload: clean
                });
            }
        }
    }
    // onReceive(cb: (data: string) => void): void {
    //     if (this.isRunning) {
    //         console.warn("Read loop already running");
    //         return;
    //     }

    //     this.isRunning = true;
    //     this.startReadLoop(cb);
    // }

    // stopReceive(): void {
    //     this.isRunning = false;
    //     this.readLoopPromise = null;
    // }
    // private async startReadLoop(cb: (data: string) => void) {
    //     while (this.isRunning) {
    //         try {
    //             // Cách 1: Đọc đến khi gặp "END"
    //             const message = await readSerialUntilString({
    //                 delimiter: "END"
    //             });

    //             if (message && message.trim()) {
    //                 const clean = message.replace(/END\s*$/, '').trim();
    //                 this.stopReceive();
    //                 if (clean) {
    //                     cb(clean);
    //                 }
    //             }

    //         } catch (err) {
    //             if (err && typeof err === 'string' && !err.includes('Timeout')) {
    //                 console.error("Read error:", err);
    //             }
    //             await new Promise(r => setTimeout(r, 50));
    //         }
    //     }
    // }


    async disconnect() {
        this.isRunning = false;
        return await closeCOM();
    }

    isConnected() {
        return this.isRunning;
    }
}
