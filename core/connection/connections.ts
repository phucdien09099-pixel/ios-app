export type ConnectionType = "Serial" | "Bluetooth" | "MQTT" | "WS";

export type FormValues = {
    type: ConnectionType

    port_name?: string
    baud_rate?: number
    data_bits?: number
    parity?: "None" | "Odd" | "Even" | "Mark" | "Space"
    stop_bits?: number

    url?: string
    clientId?: string

    deviceId?: string
}

export type ConnectionStatus =
    | "idle"
    | "connecting"
    | "connected"
    | "disconnected"
    | "error"