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

import { transportManager } from "@/core/connection/TransportManager";
import { TransportType, TransportConfigMap } from "@/core/connection/TransportConfigMap";
import { ConnectionStatus } from "@/core/connection/connections";
import { deviceRepo } from "@/db/repository/DeviceRepository";

type TransportContextType = {
    // Kích hoạt song song các phương thức truyền tin
    connectDual: (configs: Partial<TransportConfigMap>) => Promise<void>;
    disconnect: () => Promise<void>;
    send: (data: any, channel: string, strategy?: "smart" | "broadcast") => Promise<any>;
    scan: (targetTransport?: TransportType) => Promise<any[]>;
    subscribe: (topic: string) => void;

    // Trạng thái hệ thống mạng song song
    isConnected: boolean;
    connectionStatuses: Partial<Record<TransportType, ConnectionStatus>>;
    deviceStates: Record<string, any>;
    getDeviceStatus: (id: string) => boolean;
    lastMessage: any | null;
    listTopicFeature: any[];
};

const TransportContext = createContext<TransportContextType | null>(null);

export function TransportProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any | null>(null);

    // Lưu trữ trạng thái kết nối chi tiết của từng cổng mạng (MQTT, Bluetooth, ...)
    // Thêm Partial vào đây 👇
    const [connectionStatuses, setConnectionStatuses] = useState<Partial<Record<TransportType, ConnectionStatus>>>({
        MQTT: "idle",
        Bluetooth: "idle",
    });
    // Quản lý trạng thái online/offline của từng thiết bị phần cứng
    const [deviceStates, setDeviceStates] = useState<Record<string, any>>({});
    // console.log(deviceStates)
    const initializedRef = useRef(false);
    const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
    const listTopicFeature = useMemo(() => [{ init: "init" }, { pair: "pair" }], []);

    // Helper nhanh để UI lấy trạng thái ONLINE/OFFLINE của một thiết bị cụ thể
    const getDeviceStatus = useCallback(
        (id: string) => {
            return deviceStates[id]?.isOnline ?? false;
        },
        [deviceStates]
    );

    // Đồng bộ trạng thái kết nối từ Core Manager sang React State
    const syncConnectionMetadata = useCallback(() => {
        setIsConnected(transportManager.isConnected());

        // Chuyển đổi Map của tầng Core thành Plain Object để React cập nhật State mượt mà
        const currentStatuses = transportManager.getStatuses?.() || new Map();
        setConnectionStatuses(Object.fromEntries(currentStatuses) as Record<TransportType, ConnectionStatus>);
    }, []);

    // ==========================================
    // 1. API KẾT NỐI SONG SONG SONG ĐỒNG THỜI (DUAL)
    // ==========================================
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
        await transportManager.disconnect();
        setDeviceStates({}); // Xóa sạch bộ nhớ tạm trạng thái thiết bị khi ngắt hệ thống
        syncConnectionMetadata();
    }, [syncConnectionMetadata]);

    // ==========================================
    // 2. TỰ ĐỘNG KHỞI CHẠY (BOOTSTRAP) KHI MỞ APP
    // ==========================================
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const bootstrap = async () => {
            await transportManager.scan();
            console.log("[Transport Provider]: Khởi chạy hệ thống mạng Dual-Active...");

            // 1. Lấy toàn bộ danh sách thiết bị lưu dưới Local DB ra
            const devices = await deviceRepo.getDevices();

            // 2. Chuyển đổi danh sách thiết bị thành cấu hình mảng truyền vào Driver Bluetooth
            const bleDeviceConfigs = devices
                .filter(d => d.serial)
                .map(d => ({ deviceId: d.serial!, name: d.name }));

            // 3. Kích hoạt song song đồng thời: MQTT lắng nghe Cloud và BLE kết nối tới N thiết bị
            await connectDual({
                MQTT: {
                    // clientId: `app_${Math.random().toString(36).substring(7)}`,
                    topicsToSubscribe: [
                        { topic: "device/+/sensor/info", qos: 0 },
                        { topic: "device/+/control/set", qos: 0 },
                        { topic: "device/+/status", qos: 0 },
                        { topic: "device/init", qos: 0 },
                    ]
                },
                Bluetooth: {
                    devices: bleDeviceConfigs // Bắn mảng N thiết bị Bluetooth vào đây để kết nối đồng thời
                } as any // Ép kiểu tạm thời nếu tầng Type chưa cập nhật kịp mảng
            });

            // Ghi nhận trạng thái kết nối ban đầu cho các thiết bị BLE vừa được kích hoạt
            setDeviceStates((prev) => {
                const nextStates = { ...prev };
                devices.forEach(d => {
                    if (d.name) {
                        nextStates[d.name] = {
                            id: d.name,
                            isOnline: false, // Ban đầu set false, khi nhận được dữ liệu/ping từ thiết bị sẽ đổi sang true
                            updatedAt: new Date().toISOString()
                        };
                    }
                });
                return nextStates;
            });

            // Đăng ký topic đón đầu dữ liệu chung cho hệ thống
            transportManager.subscribe("device/+/status");
            transportManager.subscribe("device/+/sensor/info");
            transportManager.subscribe("device/+/control/set");
        };

        bootstrap();
    }, [connectDual]);
    // ==========================================
    // 3. CORE LẮNG NGHE & CẬP NHẬT TRẠNG THÁI TẬP TRUNG
    // ==========================================
    useEffect(() => {
        scan();
        // Lắng nghe dữ liệu đổ về từ cả 2 kênh mạng (MQTT và BLE)
        transportManager.onNormalizedReceive((data: any) => {
            // console.log(data);
            // if (!data || !data.channel) return;

            setLastMessage(data);
            syncConnectionMetadata();

            // Trích xuất tên thiết bị từ channel (ví dụ: "device/Device_LivingRoom/status" -> "Device_LivingRoom")
            const channelParts = data.channel.split("/");
            const deviceName = channelParts[1];

            if (deviceName) {
                const isPing = data.payload === "ping" || data.payload === "online";

                // Xử lý parse payload để lấy giá trị temp nếu có
                let extractedTemp: number | undefined = undefined;
                if (data.payload) {
                    try {
                        // Nếu payload gửi về dạng Object sẵn hoặc dạng chuỗi JSON cần parse
                        const parsedPayload = typeof data.payload === "string"
                            ? JSON.parse(data.payload)
                            : data.payload;
                        // console.log(parsedPayload.temp)
                        if (parsedPayload && typeof parsedPayload.temp !== "undefined") {
                            extractedTemp = Number(parsedPayload.temp);
                        }
                    } catch (e) {
                        // Tránh crash app nếu payload không phải là chuỗi JSON hợp lệ (ví dụ chuỗi "ping" thông thường)
                    }
                }

                // Nhận được dữ liệu hoặc gói tin ping hoạt động từ thiết bị -> Đánh dấu là ONLINE
                if (isPing || data.payload) {
                    setDeviceStates((prev) => {
                        const oldDeviceState = prev[deviceName] || {};
                        return {
                            ...prev,
                            [deviceName]: {
                                id: deviceName,
                                isOnline: true,
                                // Nếu gói tin này có kèm temp thì cập nhật temp mới, ngược lại giữ nguyên giá trị temp cũ
                                temp: extractedTemp !== undefined ? extractedTemp : oldDeviceState.temp,
                                updatedAt: new Date().toISOString()
                            },
                        };
                    });

                    // Xóa bộ đếm thời gian sập cũ nếu có
                    if (timeoutsRef.current[deviceName]) {
                        clearTimeout(timeoutsRef.current[deviceName]);
                    }

                    // Cơ chế Deadman's Switch: Sau 15 giây không nhận được bất kỳ tín hiệu nào nữa, coi như OFFLINE
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

        // Đăng ký lắng nghe sự thay đổi trạng thái On/Off mạng từ Driver Core
        transportManager.onStatusChange?.(() => {
            syncConnectionMetadata();
        });

        return () => {
            // Dọn dẹp tất cả các bộ đếm thời gian khi unmount để tránh rò rỉ bộ nhớ (Memory Leak)
            Object.values(timeoutsRef.current).forEach(clearTimeout);
            timeoutsRef.current = {};
        };
    }, []);

    // ==========================================
    // 4. CÁC THAO TÁC TRUYỀN XUẤT DỮ LIỆU
    // ==========================================
    const send = useCallback(
        async (data: any, channel: string, strategy: "smart" | "broadcast" = "smart") => {
            return transportManager.send(data, channel, strategy);
        },
        []
    );

    const subscribe = useCallback(
        (topic: string) => transportManager.subscribe(topic),
        []
    );

    const scan = useCallback(
        async (targetTransport?: TransportType) => transportManager.scan(targetTransport),
        []
    );

    // Đóng gói dữ liệu tối ưu bằng useMemo để phân phối cho toàn App tiêu thụ
    const value = useMemo(
        () => ({
            connectDual,
            disconnect,
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
