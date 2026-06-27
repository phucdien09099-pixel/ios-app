"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { ConnectionStatus } from "@/core/connection/connections";
import { transportManager } from "@/core/connection/TransportManager";
import { TransportConfigMap, TransportType } from "@/core/connection/TransportConfigMap";
import { roomRepo } from "@/db/repository/RoomRepository";

type TopicFeature = { init: string } | { pair: string };
type DeviceState = {
    id?: string;
    isOnline?: boolean;
    temp?: number;
    transport?: TransportType;
    updatedAt?: string;
    [key: string]: unknown;
};
type TransportMessage = {
    id?: string;
    channel?: string;
    payload?: unknown;
    isOnline?: boolean;
    [key: string]: unknown;
};

type TransportContextType = {
    connectDual: (configs: Partial<TransportConfigMap>) => Promise<void>;
    disconnect: () => Promise<void>;
    refreshConnection: () => Promise<void>;
    send: (data: unknown, channel: string, strategy?: "smart" | "broadcast") => Promise<unknown>;
    scan: (targetTransport?: TransportType) => Promise<unknown[]>;
    subscribe: (topic: string) => void;

    isConnected: boolean;
    connectionStatuses: Partial<Record<TransportType, ConnectionStatus>>;
    deviceStates: Record<string, DeviceState>;
    getDeviceStatus: (id: string) => boolean;
    lastMessage: TransportMessage | null;
    listTopicFeature: TopicFeature[];
};

const TransportContext = createContext<TransportContextType | null>(null);

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

const getMqttTopics = (user: string) => [
    { topic: `users/${user}/devices/+/info`, qos: 0 as const },
    { topic: `users/${user}/devices/+/status`, qos: 0 as const },
    { topic: `users/${user}/devices/+/sensor`, qos: 0 as const },
    { topic: `users/${user}/devices/+/sensor/info`, qos: 0 as const },
    // { topic: `users/${user}/devices/+/control/info`, qos: 0 as const },
    { topic: `users/${user}/devices/+/control/set`, qos: 0 as const },
];

const normalizeBleName = (value?: string | null) =>
    (value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

const readOnlineStatus = (payload: unknown): boolean | null => {
    if (typeof payload === "boolean") return payload;

    if (typeof payload === "string") {
        const normalized = payload.trim().toLowerCase();
        if (["ping", "online", "on", "true", "1", "connected"].includes(normalized)) return true;
        if (["offline", "off", "false", "0", "disconnected"].includes(normalized)) return false;

        try {
            return readOnlineStatus(JSON.parse(payload));
        } catch {
            return payload.trim() ? true : null;
        }
    }

    if (payload && typeof payload === "object") {
        const data = payload as Record<string, unknown>;

        if (typeof data.isOnline === "boolean") return data.isOnline;
        if (typeof data.online === "boolean") return data.online;
        if (typeof data.connected === "boolean") return data.connected;

        const status = data.status ?? data.state ?? data.value;
        if (typeof status === "string" || typeof status === "boolean") {
            return readOnlineStatus(status);
        }

        return true;
    }

    return null;
};

export function TransportProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<TransportMessage | null>(null);
    const [connectionStatuses, setConnectionStatuses] = useState<Partial<Record<TransportType, ConnectionStatus>>>({
        MQTT: "idle",
        Bluetooth: "idle",
    });
    const [deviceStates, setDeviceStates] = useState<Record<string, DeviceState>>({});

    const initializedRef = useRef(false);
    const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
    const entityNameMapRef = useRef<Map<string, string>>(new Map());
    const listTopicFeature = useMemo<TopicFeature[]>(() => [{ init: "init" }, { pair: "pair" }], []);

    const getDeviceStatus = useCallback(
        (id: string) => deviceStates[id]?.isOnline ?? false,
        [deviceStates]
    );

    const syncConnectionMetadata = useCallback(() => {
        setIsConnected(transportManager.isConnected());
        const currentStatuses = transportManager.getStatuses?.() || new Map();
        setConnectionStatuses(Object.fromEntries(currentStatuses) as Record<TransportType, ConnectionStatus>);
    }, []);

    const connectDual = useCallback(
        async (configs: Partial<TransportConfigMap>) => {
            try {
                await transportManager.connectDual(configs);
            } finally {
                syncConnectionMetadata();
            }
        },
        [syncConnectionMetadata]
    );

    const disconnect = useCallback(async () => {
        Object.values(timeoutsRef.current).forEach(clearTimeout);
        timeoutsRef.current = {};
        await transportManager.disconnect();
        setDeviceStates({});
        syncConnectionMetadata();
    }, [syncConnectionMetadata]);

    const scan = useCallback(
        async (targetTransport?: TransportType) => transportManager.scan(targetTransport),
        []
    );

    const subscribe = useCallback(
        (topic: string) => transportManager.subscribe(topic),
        []
    );

    const send = useCallback(
        async (data: unknown, channel: string, strategy: "smart" | "broadcast" = "smart") =>
            transportManager.send(data, channel, strategy),
        []
    );

    const connectMqttFallback = useCallback(async () => {
        const mqttUser = getCurrentMqttUser();

        await connectDual({
            MQTT: {
                topicsToSubscribe: getMqttTopics(mqttUser),
            },
        });

        transportManager.subscribe(`users/${mqttUser}/devices/+/info`);
        transportManager.subscribe(`users/${mqttUser}/devices/+/status`);
        transportManager.subscribe(`users/${mqttUser}/devices/+/sensor`);
        transportManager.subscribe(`users/${mqttUser}/devices/+/sensor/info`);
        // transportManager.subscribe(`users/${mqttUser}/devices/+/control/info`);
        transportManager.subscribe(`users/${mqttUser}/devices/+/control/set`);
        syncConnectionMetadata();
    }, [connectDual, syncConnectionMetadata]);

    const runSmartConnection = useCallback(async (resetConnection = false) => {
        if (resetConnection) {
            Object.values(timeoutsRef.current).forEach(clearTimeout);
            timeoutsRef.current = {};
            await transportManager.disconnect();
            syncConnectionMetadata();
        }

        console.log("[Transport Provider]: Quét BLE trước, không thấy mới fallback MQTT...");

        const rooms = await roomRepo.getRooms();
        const roomNames = rooms.map((room) => room.name).filter(Boolean);
        entityNameMapRef.current = new Map(roomNames.map((name) => [normalizeBleName(name), name]));

        setDeviceStates((prev) => {
            const nextStates = resetConnection ? {} : { ...prev };
            roomNames.forEach((name) => {
                nextStates[name] = {
                    ...nextStates[name],
                    id: name,
                    isOnline: false,
                    updatedAt: new Date().toISOString(),
                };
            });
            return nextStates;
        });

        const roomNameMap = entityNameMapRef.current;
        const scannedBleDevices = await transportManager.scan("Bluetooth");
        const matchedBleDevices = scannedBleDevices
            .map((bleDevice) => {
                const deviceRecord = bleDevice && typeof bleDevice === "object"
                    ? bleDevice as Record<string, unknown>
                    : {};
                const deviceName = typeof deviceRecord.name === "string" ? deviceRecord.name : "";
                const deviceAddress = typeof deviceRecord.address === "string" ? deviceRecord.address : "";
                const bleName = normalizeBleName(deviceName);
                if (!bleName || !deviceAddress) return null;

                const matchedRoom = Array.from(roomNameMap.entries()).find(([normalizedRoomName]) =>
                    bleName.includes(normalizedRoomName) || normalizedRoomName.includes(bleName)
                );

                if (!matchedRoom) return null;

                return {
                    deviceId: deviceAddress,
                    name: matchedRoom[1],
                };
            })
            .filter(Boolean) as { deviceId: string; name: string }[];

        if (matchedBleDevices.length > 0) {
            try {
                await connectDual({
                    Bluetooth: {
                        devices: matchedBleDevices,
                    },
                });

                if (transportManager.isConnected("Bluetooth")) {
                    setDeviceStates((prev) => {
                        const nextStates = { ...prev };
                        matchedBleDevices.forEach((device) => {
                            nextStates[device.name] = {
                                id: device.name,
                                isOnline: true,
                                transport: "Bluetooth",
                                updatedAt: new Date().toISOString(),
                            };
                        });
                        return nextStates;
                    });
                    syncConnectionMetadata();
                    console.log("[Transport Provider]: Đã kết nối BLE, không bật MQTT.");
                    return;
                }
            } catch (error) {
                console.warn("[Transport Provider]: BLE không khả dụng, chuyển sang MQTT.", error);
            }
        }

        await connectMqttFallback();
    }, [connectDual, connectMqttFallback, syncConnectionMetadata]);

    const refreshConnection = useCallback(async () => {
        await runSmartConnection(true);
    }, [runSmartConnection]);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        runSmartConnection(false).catch((error) => {
            console.error("[Transport Provider]: Không thể khởi động transport:", error);
        });
    }, [runSmartConnection]);

    useEffect(() => {
        transportManager.onNormalizedReceive((data: TransportMessage) => {
            setLastMessage(data);
            syncConnectionMetadata();

            const messageDeviceId = data.id;
            if (messageDeviceId && typeof data.isOnline === "boolean") {
                setDeviceStates((prev) => ({
                    ...prev,
                    [messageDeviceId]: {
                        ...(prev[messageDeviceId] || {}),
                        id: messageDeviceId,
                        isOnline: data.isOnline,
                        updatedAt: new Date().toISOString(),
                    },
                }));
                return;
            }

            if (!data?.channel) return;

            const channelParts = data.channel.split("/");
            const rawDeviceName = channelParts[0] === "users"
                ? channelParts[3]
                : channelParts[1];
            const deviceName = entityNameMapRef.current.get(normalizeBleName(rawDeviceName)) ?? rawDeviceName;
            if (!deviceName) return;

            const onlineStatus = readOnlineStatus(data.payload);
            let extractedTemp: number | undefined;

            if (data.payload) {
                try {
                    const parsedPayload = typeof data.payload === "string"
                        ? JSON.parse(data.payload)
                        : data.payload;

                    if (parsedPayload && typeof parsedPayload.temp !== "undefined") {
                        extractedTemp = Number(parsedPayload.temp);
                    }
                } catch {
                    // Non-JSON payloads such as "ping" are valid status messages.
                }
            }

            if (onlineStatus !== null || data.payload) {
                setDeviceStates((prev) => {
                    const oldDeviceState = prev[deviceName] || {};
                    return {
                        ...prev,
                        [deviceName]: {
                            id: deviceName,
                            isOnline: onlineStatus ?? true,
                            temp: extractedTemp !== undefined ? extractedTemp : oldDeviceState.temp,
                            updatedAt: new Date().toISOString(),
                        },
                    };
                });

                if (timeoutsRef.current[deviceName]) {
                    clearTimeout(timeoutsRef.current[deviceName]);
                }

                if (onlineStatus !== false) {
                    timeoutsRef.current[deviceName] = setTimeout(() => {
                        setDeviceStates((prev) => {
                            if (!prev[deviceName]) return prev;
                            return {
                                ...prev,
                                [deviceName]: {
                                    ...prev[deviceName],
                                    isOnline: false,
                                },
                            };
                        });
                        delete timeoutsRef.current[deviceName];
                    }, 15000);
                }
            }
        });

        transportManager.onStatusChange?.(() => {
            syncConnectionMetadata();
        });

        return () => {
            Object.values(timeoutsRef.current).forEach(clearTimeout);
            timeoutsRef.current = {};
        };
    }, [syncConnectionMetadata]);

    const value = useMemo(
        () => ({
            connectDual,
            disconnect,
            refreshConnection,
            send,
            scan,
            subscribe,
            getDeviceStatus,
            isConnected,
            connectionStatuses,
            deviceStates,
            listTopicFeature,
            lastMessage,
        }),
        [
            connectDual,
            disconnect,
            refreshConnection,
            send,
            scan,
            subscribe,
            getDeviceStatus,
            isConnected,
            connectionStatuses,
            deviceStates,
            listTopicFeature,
            lastMessage,
        ]
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
