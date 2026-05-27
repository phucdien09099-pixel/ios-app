// src/lib/ble/BLEService.ts

import { AdapterState, BleDevice, BleService, checkPermissions, connect, disconnect, getAdapterState, getConnectionUpdates, getScanningUpdates, listServices, read, readString, send, sendString, startScan, stopScan, subscribe, subscribeString, unsubscribe, } from "@mnlphlp/plugin-blec";

export type BLEDeviceCallback = (
    devices: BleDevice[]
) => void;

export type BLEConnectionCallback = (
    connected: boolean
) => void;

export type BLEScanStateCallback = (
    scanning: boolean
) => void;

export class BLEService {
    private connectedDevice: BleDevice | null = null;

    private currentService?: string;

    // =========================
    // Permissions
    // =========================

    async ensurePermissions(
        askIfDenied = true
    ) {
        return await checkPermissions(
            askIfDenied
        );
    }

    // =========================
    // Adapter
    // =========================

    async getAdapterState(): Promise<AdapterState> {
        return await getAdapterState();
    }

    // =========================
    // Scan
    // =========================

    async startScan(
        callback: BLEDeviceCallback,
        timeout = 10000,
        allowIbeacons = false
    ) {
        await startScan(
            (devices) => {
                callback(devices);
            },
            timeout,
            allowIbeacons
        );
    }

    async stopScan() {
        await stopScan();
    }

    async onScanningUpdates(
        callback: BLEScanStateCallback
    ) {
        await getScanningUpdates(
            callback
        );
    }

    // =========================
    // Connection
    // =========================

    async connect(device: BleDevice, onDisconnect?: () => void, allowIbeacons = false) {
        await connect(device.address, onDisconnect || null, allowIbeacons);
        this.connectedDevice = device;
    }

    async disconnect() {
        await disconnect();

        this.connectedDevice = null;
    }

    async onConnectionUpdates(
        callback: BLEConnectionCallback
    ) {
        await getConnectionUpdates(
            callback
        );
    }

    isConnected() {
        return !!this.connectedDevice;
    }

    getConnectedDevice() {
        return this.connectedDevice;
    }

    // =========================
    // Services
    // =========================

    async listServices() {
        if (!this.connectedDevice) {
            throw new Error(
                "No connected device"
            );
        }

        return (await listServices(
            this.connectedDevice.address
        )) as BleService[];
    }

    setService(serviceUUID: string) {
        this.currentService = serviceUUID;
    }

    // =========================
    // Write
    // =========================

    async send(
        characteristic: string,
        data: number[],
        writeType:
            | "withResponse"
            | "withoutResponse" = "withResponse"
    ) {
        await send(
            characteristic,
            data,
            writeType,
            this.currentService
        );
    }

    async sendString(
        characteristic: string,
        data: string,
        writeType:
            | "withResponse"
            | "withoutResponse" = "withResponse"
    ) {
        await sendString(
            characteristic,
            data,
            writeType,
            this.currentService
        );
    }

    // =========================
    // Read
    // =========================

    async read(
        characteristic: string
    ) {
        return await read(
            characteristic,
            this.currentService
        );
    }

    async readString(
        characteristic: string
    ) {
        return await readString(
            characteristic,
            this.currentService
        );
    }

    // =========================
    // Subscribe
    // =========================

    async subscribe(
        characteristic: string,
        callback: (
            data: number[]
        ) => void
    ) {
        await subscribe(
            characteristic,
            callback
        );
    }

    async subscribeString(
        characteristic: string,
        callback: (
            data: string
        ) => void
    ) {
        await subscribeString(
            characteristic,
            callback
        );
    }

    async unsubscribe(
        characteristic: string
    ) {
        await unsubscribe(
            characteristic
        );
    }
}

export const bleService = new BLEService();