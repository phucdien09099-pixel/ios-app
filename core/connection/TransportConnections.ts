import { BluetoothTransport } from "./bluetooth/BluetoothTransport";
import { MqttTransport } from "./mqtt/MqttTransport";
import { RS458Transports } from "./rs485/RS458Transports";
import { TransportsInterface } from "./TransportsInterface";

export type ConnectionType = "MQTT" | "Bluetooth" | "RS485";

export function createConnection(type: ConnectionType): TransportsInterface {
    switch (type) {
        case "MQTT":
            return new MqttTransport();
        case "Bluetooth":
            return new BluetoothTransport();
        case "RS485":
        // return new Rs485Transport(); // Đảm bảo bạn đã import class này vào
        default:
            throw new Error(`Unsupported connection type: ${type}`);
    }
}
