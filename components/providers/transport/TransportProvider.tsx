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
import {
    TransportConfigMap,
    TransportType,
} from "@/core/connection/TransportConfigMap";
import { roomRepo } from "@/db/repository/RoomRepository";
import { bleService } from "@/utils/Tauri/BluetoothSerial";

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
    send: (
        data: unknown,
        channel: string,
        strategy?: "smart" | "broadcast"
    ) => Promise<unknown>;
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

/**
 * Nếu app chỉ chạy nền ngắn và transport vẫn báo connected thì không reconnect.
 * Khi chạy nền lâu hơn mốc này, provider sẽ dựng lại transport để tránh socket/BLE
 * đã chết ngầm nhưng trạng thái nội bộ vẫn còn connected.
 */
const LONG_BACKGROUND_RECONNECT_MS = 30_000;
const LIFECYCLE_DEBOUNCE_MS = 250;
const LIFECYCLE_THROTTLE_MS = 2_000;

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

const getMqttTopics = (user: string) => {
    const topics = [
        `users/${user}/devices/+/info`,
        `users/${user}/devices/+/status`,
        `users/${user}/devices/+/sensor`,
        `users/${user}/devices/+/sensor/info`,
        `users/${user}/devices/+/control/set`,

        // Member account có thể nhận heartbeat/status do owner publish.
        "users/+/devices/+/info",
        "users/+/devices/+/status",
        "users/+/devices/+/sensor",
        "users/+/devices/+/sensor/info",
    ];

    return Array.from(new Set(topics)).map((topic) => ({
        topic,
        qos: 0 as const,
    }));
};

const normalizeBleName = (value?: string | null) =>
    (value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

const readOnlineStatus = (payload: unknown): boolean | null => {
    if (typeof payload === "boolean") return payload;

    if (typeof payload === "string") {
        const normalized = payload.trim().toLowerCase();

        if (["ping", "online", "on", "true", "1", "connected"].includes(normalized)) {
            return true;
        }

        if (["offline", "off", "false", "0", "disconnected"].includes(normalized)) {
            return false;
        }

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
    const [connectionStatuses, setConnectionStatuses] = useState<
        Partial<Record<TransportType, ConnectionStatus>>
    >({
        MQTT: "idle",
        Bluetooth: "idle",
    });
    const [deviceStates, setDeviceStates] = useState<Record<string, DeviceState>>({});

    const initializedRef = useRef(false);
    const connectionRunRef = useRef<Promise<void> | null>(null);
    const backgroundedAtRef = useRef<number | null>(null);
    const lastLifecycleReconnectAtRef = useRef(0);
    const lifecycleReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const entityNameMapRef = useRef<Map<string, string>>(new Map());

    const listTopicFeature = useMemo<TopicFeature[]>(
        () => [{ init: "init" }, { pair: "pair" }],
        []
    );

    const getDeviceStatus = useCallback(
        (id: string) => deviceStates[id]?.isOnline ?? false,
        [deviceStates]
    );

    const syncConnectionMetadata = useCallback(() => {
        setIsConnected(transportManager.isConnected());

        const currentStatuses = transportManager.getStatuses?.() || new Map();
        setConnectionStatuses(
            Object.fromEntries(currentStatuses) as Record<TransportType, ConnectionStatus>
        );
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

    /**
     * Disconnect do người dùng/chức năng gọi trực tiếp mới xoá trạng thái thiết bị.
     * Reconnect nội bộ khi resume không dùng hàm này, vì cần giữ UI hiện trạng thái cũ.
     */
    const disconnect = useCallback(async () => {
        await transportManager.disconnect();
        setDeviceStates({});
        syncConnectionMetadata();
    }, [syncConnectionMetadata]);

    const scan = useCallback(
        async (targetTransport?: TransportType) =>
            transportManager.scan(targetTransport),
        []
    );

    const subscribe = useCallback(
        (topic: string) => transportManager.subscribe(topic),
        []
    );

    const send = useCallback(
        async (
            data: unknown,
            channel: string,
            strategy: "smart" | "broadcast" = "smart"
        ) => transportManager.send(data, channel, strategy),
        []
    );

    const loadRooms = useCallback(async () => {
        const rooms = await roomRepo.getRooms();
        const roomNames = rooms
            .map((room) => room.name)
            .filter((name): name is string => Boolean(name));

        entityNameMapRef.current = new Map(
            roomNames.map((name) => [normalizeBleName(name), name])
        );

        // Chỉ bổ sung room chưa có. Không reset isOnline và không ghi đè dữ liệu cũ.
        setDeviceStates((prev) => {
            const nextStates = { ...prev };

            roomNames.forEach((name) => {
                if (!nextStates[name]) {
                    nextStates[name] = {
                        id: name,
                        isOnline: false,
                    };
                }
            });

            return nextStates;
        });

        return roomNames;
    }, []);

    const connectMqttFallback = useCallback(async () => {
        // Nếu MQTT thực sự đang connected thì chỉ đồng bộ metadata.
        if (transportManager.isConnected("MQTT")) {
            syncConnectionMetadata();
            return;
        }

        const mqttUser = getCurrentMqttUser();
        const mqttTopics = getMqttTopics(mqttUser);

        await connectDual({
            MQTT: {
                topicsToSubscribe: mqttTopics,
            },
        });

        // Giữ tương thích với TransportManager hiện tại.
        // Nếu adapter đã tự subscribe qua topicsToSubscribe thì thao tác này nên idempotent.
        mqttTopics.forEach(({ topic }) => {
            transportManager.subscribe(topic);
        });

        syncConnectionMetadata();
    }, [connectDual, syncConnectionMetadata]);

    const connectBluetoothOrFallbackMqtt = useCallback(
        async (roomNames: string[]) => {
            let bluetoothReady = false;

            try {
                // Chỉ chạy scan khi Bluetooth máy đang bật và có thể sử dụng.
                bluetoothReady = await bleService.hasUsableBluetooth(false);
            } catch (error) {
                console.warn(
                    "[Transport Provider]: Không kiểm tra được Bluetooth, fallback MQTT WS.",
                    error
                );
            }

            if (!bluetoothReady) {
                console.log(
                    "[Transport Provider]: Bluetooth đang tắt/không khả dụng, fallback MQTT WS."
                );
                await connectMqttFallback();
                return;
            }

            // Bluetooth đang bật: nếu BLE đã connected thì không scan lại.
            if (transportManager.isConnected("Bluetooth")) {
                syncConnectionMetadata();
                return;
            }

            try {
                const scannedBleDevices = await transportManager.scan("Bluetooth");
                const roomNameMap = entityNameMapRef.current;

                const matchedBleDevices = scannedBleDevices
                    .map((bleDevice) => {
                        const deviceRecord =
                            bleDevice && typeof bleDevice === "object"
                                ? (bleDevice as Record<string, unknown>)
                                : {};

                        const deviceName =
                            typeof deviceRecord.name === "string"
                                ? deviceRecord.name
                                : "";
                        const deviceAddress =
                            typeof deviceRecord.address === "string"
                                ? deviceRecord.address
                                : "";
                        const bleName = normalizeBleName(deviceName);

                        if (!bleName || !deviceAddress) return null;

                        const matchedRoom = Array.from(roomNameMap.entries()).find(
                            ([normalizedRoomName]) =>
                                bleName.includes(normalizedRoomName) ||
                                normalizedRoomName.includes(bleName)
                        );

                        if (!matchedRoom) return null;

                        return {
                            deviceId: deviceAddress,
                            name: matchedRoom[1],
                        };
                    })
                    .filter(
                        (device): device is { deviceId: string; name: string } =>
                            Boolean(device)
                    );

                if (matchedBleDevices.length > 0) {
                    await connectDual({
                        Bluetooth: {
                            devices: matchedBleDevices,
                        },
                    });

                    if (transportManager.isConnected("Bluetooth")) {
                        const connectedAt = new Date().toISOString();

                        setDeviceStates((prev) => {
                            const nextStates = { ...prev };

                            matchedBleDevices.forEach((device) => {
                                nextStates[device.name] = {
                                    ...nextStates[device.name],
                                    id: device.name,
                                    isOnline: true,
                                    transport: "Bluetooth",
                                    updatedAt: connectedAt,
                                };
                            });

                            return nextStates;
                        });

                        syncConnectionMetadata();
                        console.log(
                            "[Transport Provider]: Đã kết nối BLE, không cần MQTT WS."
                        );
                        return;
                    }
                }

                console.log(
                    `[Transport Provider]: Bluetooth bật nhưng không tìm thấy thiết bị phù hợp (${roomNames.length} room), fallback MQTT WS.`
                );
            } catch (error) {
                console.warn(
                    "[Transport Provider]: Quét/kết nối BLE thất bại, fallback MQTT WS.",
                    error
                );
            }

            await connectMqttFallback();
        },
        [connectDual, connectMqttFallback, syncConnectionMetadata]
    );

    /**
     * forceReconnect = true:
     * - Dựng lại transport sau khi app chạy nền lâu hoặc network vừa online.
     * - Không xoá deviceStates, vì UI được phép giữ trạng thái cuối cùng trong lúc reconnect.
     *
     * forceReconnect = false:
     * - Nếu BLE hoặc MQTT vẫn connected thì không làm lại kết nối.
     */
    const runSmartConnection = useCallback(
        async (forceReconnect = false) => {
            if (connectionRunRef.current) {
                await connectionRunRef.current;
                return;
            }

            let releaseConnectionRun: () => void = () => undefined;
            connectionRunRef.current = new Promise<void>((resolve) => {
                releaseConnectionRun = resolve;
            });

            try {
                const hasActiveTransport =
                    transportManager.isConnected("Bluetooth") ||
                    transportManager.isConnected("MQTT");

                if (!forceReconnect && hasActiveTransport) {
                    syncConnectionMetadata();
                    return;
                }

                const roomNames = await loadRooms();

                if (forceReconnect) {
                    // Chỉ reset lớp kết nối; tuyệt đối không reset deviceStates.
                    try {
                        await transportManager.disconnect();
                    } catch (error) {
                        console.warn(
                            "[Transport Provider]: Disconnect transport cũ không hoàn tất, tiếp tục reconnect.",
                            error
                        );
                    } finally {
                        syncConnectionMetadata();
                    }
                }

                await connectBluetoothOrFallbackMqtt(roomNames);

                if (!transportManager.isConnected()) {
                    throw new Error(
                        "Không thể kết nối Bluetooth hoặc MQTT WebSocket."
                    );
                }
            } finally {
                releaseConnectionRun();
                connectionRunRef.current = null;
                syncConnectionMetadata();
            }
        },
        [
            connectBluetoothOrFallbackMqtt,
            loadRooms,
            syncConnectionMetadata,
        ]
    );

    const refreshConnection = useCallback(async () => {
        await runSmartConnection(true);
    }, [runSmartConnection]);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        runSmartConnection(false).catch((error) => {
            console.error(
                "[Transport Provider]: Không thể khởi động transport:",
                error
            );
        });
    }, [runSmartConnection]);

    useEffect(() => {
        const ensureConnectionAfterResume = (
            reason: string,
            forceReconnect: boolean
        ) => {
            if (document.visibilityState === "hidden") return;

            const now = Date.now();
            if (
                !forceReconnect &&
                now - lastLifecycleReconnectAtRef.current <
                LIFECYCLE_THROTTLE_MS
            ) {
                return;
            }

            if (lifecycleReconnectTimerRef.current) {
                clearTimeout(lifecycleReconnectTimerRef.current);
            }

            lifecycleReconnectTimerRef.current = setTimeout(() => {
                lifecycleReconnectTimerRef.current = null;
                lastLifecycleReconnectAtRef.current = Date.now();

                const transportStillConnected = transportManager.isConnected();
                const shouldForceReconnect =
                    forceReconnect || !transportStillConnected;

                console.log(
                    `[Transport Provider]: App trở lại (${reason}). ` +
                    `connected=${transportStillConnected}, force=${shouldForceReconnect}`
                );

                runSmartConnection(shouldForceReconnect).catch((error) => {
                    console.error(
                        "[Transport Provider]: Không thể đảm bảo transport sau khi app trở lại:",
                        error
                    );
                    syncConnectionMetadata();
                });
            }, LIFECYCLE_DEBOUNCE_MS);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                backgroundedAtRef.current = Date.now();
                syncConnectionMetadata();
                return;
            }

            const hiddenDuration = backgroundedAtRef.current
                ? Date.now() - backgroundedAtRef.current
                : 0;
            backgroundedAtRef.current = null;

            const wasBackgroundedForLongTime =
                hiddenDuration >= LONG_BACKGROUND_RECONNECT_MS;

            ensureConnectionAfterResume(
                `foreground sau ${Math.round(hiddenDuration / 1000)}s`,
                wasBackgroundedForLongTime || !transportManager.isConnected()
            );
        };

        const handleFocus = () => {
            // focus thường đi cùng visibilitychange, debounce/throttle sẽ gộp lại.
            ensureConnectionAfterResume(
                "focus",
                !transportManager.isConnected()
            );
        };

        const handleOnline = () => {
            // Network vừa trở lại: dựng lại transport để MQTT WS chắc chắn usable.
            ensureConnectionAfterResume("network-online", true);
        };

        const handlePageShow = (event: PageTransitionEvent) => {
            ensureConnectionAfterResume(
                event.persisted ? "pageshow-cache" : "pageshow",
                event.persisted || !transportManager.isConnected()
            );
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("online", handleOnline);
        window.addEventListener("pageshow", handlePageShow);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("pageshow", handlePageShow);

            if (lifecycleReconnectTimerRef.current) {
                clearTimeout(lifecycleReconnectTimerRef.current);
                lifecycleReconnectTimerRef.current = null;
            }
        };
    }, [runSmartConnection, syncConnectionMetadata]);

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

            if (!data.channel) return;

            const channelParts = data.channel.split("/");
            const rawDeviceName =
                channelParts[0] === "users"
                    ? channelParts[3]
                    : channelParts[1];
            const deviceName =
                entityNameMapRef.current.get(normalizeBleName(rawDeviceName)) ??
                rawDeviceName;

            if (!deviceName) return;

            const isStatusChannel = channelParts.at(-1) === "status";
            const onlineStatus = isStatusChannel
                ? readOnlineStatus(data.payload)
                : null;
            let extractedTemp: number | undefined;

            if (data.payload) {
                try {
                    const parsedPayload =
                        typeof data.payload === "string"
                            ? JSON.parse(data.payload)
                            : data.payload;

                    if (
                        parsedPayload &&
                        typeof parsedPayload === "object" &&
                        "temp" in parsedPayload &&
                        typeof (parsedPayload as Record<string, unknown>).temp !==
                        "undefined"
                    ) {
                        const parsedTemp = Number(
                            (parsedPayload as Record<string, unknown>).temp
                        );

                        if (Number.isFinite(parsedTemp)) {
                            extractedTemp = parsedTemp;
                        }
                    }
                } catch {
                    // Payload status như "ping" không phải JSON vẫn hợp lệ.
                }
            }

            if (isStatusChannel && onlineStatus !== null) {
                setDeviceStates((prev) => {
                    const oldDeviceState = prev[deviceName] || {};

                    return {
                        ...prev,
                        [deviceName]: {
                            ...oldDeviceState,
                            id: deviceName,
                            isOnline: onlineStatus,
                            temp:
                                extractedTemp !== undefined
                                    ? extractedTemp
                                    : oldDeviceState.temp,
                            updatedAt: new Date().toISOString(),
                        },
                    };
                });
            } else if (extractedTemp !== undefined) {
                setDeviceStates((prev) => ({
                    ...prev,
                    [deviceName]: {
                        ...(prev[deviceName] || {}),
                        id: deviceName,
                        temp: extractedTemp,
                        updatedAt: new Date().toISOString(),
                    },
                }));
            }
        });

        transportManager.onStatusChange?.(() => {
            syncConnectionMetadata();
        });

        // TransportManager hiện tại không cung cấp hàm unsubscribe listener.
        // Nếu API có trả cleanup function, nên gọi cleanup tại đây.
        return undefined;
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

    if (!ctx) {
        throw new Error("useTransport must be used inside TransportProvider");
    }

    return ctx;
}
