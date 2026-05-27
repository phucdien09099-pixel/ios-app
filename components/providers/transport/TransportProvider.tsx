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
import { Room } from "@/db/types/room";

type TransportContextType = {
    getDeviceStatus: (name: string) => boolean;
    connect: (config: any) => Promise<void>;
    disconnect: () => Promise<void>;
    send: (data: any, channel: string) => Promise<any>;
    scan: () => Promise<any>;
    subscribe: (topic: string) => void;
    autoConnect: () => Promise<void>;
    initConn: (value: ConnectionType) => void;
    isConnected: boolean;
    type: ConnectionType | null;
    listTopicFeature: any[];
    lastMessage: any;
};
type DeviceState = {
    name: string;
    isConnected: boolean;
};

type DeviceStateMap = Record<string, boolean>;
const TransportContext = createContext<TransportContextType | null>(null);

export function TransportProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isConnected, setIsConnected] = useState(false);
    const [type, setType] = useState<ConnectionType>("Bluetooth");
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [deviceStates, setDeviceStates] = useState<DeviceStateMap>({});
    // IMPORTANT
    const initializedRef = useRef(false);
    const connectingRef = useRef(false);

    const listTopicFeature = [
        { init: "init" }
        , { pair: "pair" }
    ];

    const getDeviceStatus = useCallback(
        (name: string) => {
            return deviceStates[name] ?? false;
        },
        [deviceStates]
    );

    // =========================
    // STATE
    // =========================

    const syncState = useCallback(() => {
        const conn = transportManager.getConnection();

        setIsConnected(conn?.isConnected() || false);
        setType(transportManager.getType() as ConnectionType);
    }, []);

    // =========================
    // INIT
    // =========================

    const initConn = useCallback((value: ConnectionType) => {
        transportManager.init(value);
    }, []);

    // =========================
    // ACTIONS
    // =========================

    const connect = useCallback(
        async (config: any) => {
            if (connectingRef.current) return;

            connectingRef.current = true;

            try {
                await transportManager.connect(config);
                syncState();
            } finally {
                connectingRef.current = false;
            }
        },
        [syncState]
    );

    const disconnect = useCallback(async () => {
        await transportManager.disconnect();
        syncState();
    }, [syncState]);

    const send = useCallback(async (data: any, channel: string) => {
        return transportManager.send(data, channel);
    }, []);

    const subscribe = useCallback((topic: string) => {
        transportManager.subscribe(topic);
    }, []);

    const scan = useCallback(async () => {
        return transportManager.scan();
    }, []);

    const autoConnect = useCallback(async () => {
        if (connectingRef.current) return null;

        connectingRef.current = true;

        try {
            syncState();

            const result = await transportManager.autoConnect();

            if (result?.name) {
                setDeviceStates((prev) => ({
                    ...prev,
                    [result.name]: result.isConnected,
                }));
            }
            syncState();

            return result;
        } finally {
            connectingRef.current = false;
        }
    }, [syncState]);

    // =========================
    // STARTUP FLOW
    // =========================

    useEffect(() => {
        // Prevent StrictMode double call
        if (initializedRef.current) return;

        initializedRef.current = true;

        const bootstrap = async () => {
            try {
                initConn("Bluetooth");

                // wait scan finish first
                // console.log(await scan());

                // small delay for peripheral cache
                // await new Promise((r) => setTimeout(r, 1000));

                console.log(await autoConnect())
            } catch (err) {
                console.error(err);
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

        return () => {
            // cleanup if available
            // transportManager.offReceive(handler);
        };
    }, []);

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
            getState: () => transportManager.isConnected(),
            isConnected,
            type,
            listTopicFeature,
            lastMessage,
        }),
        [connect, disconnect, send, scan, autoConnect, isConnected, type]
    );

    return (
        <TransportContext.Provider value={value}>
            {children}
        </TransportContext.Provider>
    );
}

export function useTransport() {
    const ctx = useContext(TransportContext);

    if (!ctx) {
        throw new Error("useTransport must be used inside TransportProvider");
    }

    return ctx;
}