"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    useCallback,
    useRef,
} from "react";

import { ConnectionType } from "@/core/connection/connections";
import { transportManager } from "@/core/connection/TransportManager";
import { TransportMessage } from "@/core/connection/TransportsInterface";
import { roomRepo } from "@/db/repository/RoomRepository";
import { BleDevice } from "@mnlphlp/plugin-blec";

type TransportContextType = {
    getDeviceStatus: (name: string) => boolean;
    connect: (config: any) => Promise<void>;
    disconnect: () => Promise<void>;
    send: (data: any, channel: string) => Promise<any>;
    scan: () => Promise<any>;
    subscribe: (topic: string) => void;
    autoConnect: () => Promise<any>;
    initConn: (value: ConnectionType) => void;
    isConnected: boolean;
    connectedDevice: string | null;
    type: ConnectionType | null;
    listTopicFeature: any[];
    lastMessage: any;
};

type DeviceStateMap = Record<string, boolean>;

const TransportContext = createContext<TransportContextType | null>(null);

export function TransportProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [type, setType] = useState<ConnectionType>("Bluetooth");
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [deviceStates, setDeviceStates] = useState<DeviceStateMap>({});
    const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
    console.log(deviceStates)
    const initializedRef = useRef(false);
    const connectingRef = useRef(false);

    const listTopicFeature = [{ init: "init" }, { pair: "pair" }];

    const getDeviceStatus = useCallback(
        (name: string) => deviceStates[name] ?? false,
        [deviceStates]
    );

    // =========================
    // STATE SYNC
    // =========================

    const syncState = useCallback(() => {
        const conn = transportManager.getConnection();
        const connected = conn?.isConnected() || false;
        setIsConnected(connected);
        setType(transportManager.getType() as ConnectionType);

        // Clear connected device name if disconnected
        if (!connected) {
            setConnectedDevice(null);
        }
    }, []);

    // =========================
    // INIT
    // =========================

    const initConn = useCallback((value: ConnectionType) => {
        transportManager.init(value);
    }, []);

    // =========================
    // CONNECT
    // =========================

    const connect = useCallback(
        async (config: any) => {
            // try {
            syncState();

            console.log(config);

            if (config?.device?.name) {
                setDeviceStates((prev) => ({
                    ...prev,
                    [config.device.name]: true,
                }));
            }
            return await transportManager.connect(config);


            // } catch (err) {
            //     console.error(err);
            // }
        },
        [syncState]
    );
    // =========================
    // DISCONNECT
    // =========================

    const disconnect = useCallback(async () => {
        await transportManager.disconnect();
        setConnectedDevice(null);
        syncState();
    }, [syncState]);

    // =========================
    // SEND / SUBSCRIBE / SCAN
    // =========================

    const send = useCallback(
        async (data: any, channel: string) => transportManager.send(data, channel),
        []
    );

    const subscribe = useCallback(
        (topic: string) => transportManager.subscribe(topic),
        []
    );

    const scan = useCallback(
        async () => transportManager.scan(),
        []
    );

    // =========================
    // AUTO CONNECT
    // =========================

    const autoConnect = useCallback(async () => {
        if (connectingRef.current) return null;
        connectingRef.current = true;

        try {
            const result = await transportManager.autoConnect();

            if (result?.name) {
                setConnectedDevice(result.name);
                setDeviceStates((prev) => ({
                    ...prev,
                    [result.name]: true,
                }));
            }

            syncState();
            return result;
        } catch (err) {
            console.warn("AutoConnect failed:", err);
            syncState();
            return null;
        } finally {
            connectingRef.current = false;
        }
    }, [syncState]);

    // =========================
    // BLE
    // =========================
    // const connectAllDeviceInrange = async () => {
    //     const devices: BleDevice[] = await scan();
    //     const rooms = await roomRepo.getRooms();
    //     console.log(devices)
    //     console.log(rooms)
    //     const matchedDevices = devices && devices.filter((device: BleDevice) =>
    //         rooms.some(room => room.name === device?.name)
    //     );

    //     console.log(matchedDevices);

    //     const connections = await Promise.all(
    //         matchedDevices.map(async (device: BleDevice) => {
    //             return await connect({
    //                 device,
    //                 txCharacteristic: process.env.NEXT_PUBLIC_CHAR_UUID_TX!,
    //                 serviceUUID: process.env.NEXT_PUBLIC_SERVICE_UUID!,
    //             });
    //         })
    //     );

    //     console.log(connections);


    //     return matchedDevices;
    // };
    // =========================
    // STARTUP
    // =========================

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const bootstrap = async () => {
            try {
                initConn("Bluetooth");
                // await connectAllDeviceInrange();
                const device = await autoConnect();
                if (device) {
                    console.log("Auto-connected to:", device.name);
                } else {
                    console.log("No device in range");
                }
            } catch (err) {
                console.error("Bootstrap error:", err);
            }
        };

        bootstrap();
    }, []);

    // =========================
    // RECEIVE
    // =========================

    useEffect(() => {
        const handler = (data: TransportMessage) => {
            console.log(data);
            setLastMessage(data);
        };

        transportManager.onReceive(handler);
    }, []);

    // =========================
    // PERIODIC RECONNECT
    // =========================

    // useEffect(() => {
    //     const interval = setInterval(async () => {
    //         if (!transportManager.isConnected() && !connectingRef.current) {
    //             console.log("Connection lost, attempting reconnect...");
    //             await autoConnect();
    //         }
    //     }, 10_000); // retry every 10s if disconnected

    //     return () => clearInterval(interval);
    // }, [autoConnect]);

    // =========================
    // VALUE
    // =========================

    const value = useMemo(
        () => ({
            connect,
            disconnect,
            send,
            scan,
            subscribe,
            autoConnect,
            getDeviceStatus,
            initConn,
            isConnected,
            connectedDevice,
            type,
            listTopicFeature,
            lastMessage,
        }),
        [connect, disconnect, send, scan, autoConnect, isConnected, connectedDevice, type, lastMessage]
    );

    return (
        <TransportContext.Provider value={value}>
            {children}
        </TransportContext.Provider>
    );
}

export function useTransport() {
    const ctx = useContext(TransportContext);
    if (!ctx) throw new Error("useTransport must be used inside TransportProvider");
    return ctx;
}
