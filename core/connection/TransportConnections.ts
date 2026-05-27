import { BluetoothTransport } from "./bluetooth/BluetoothTransport";
import { ConnectionType } from "./connections";
import { WebSocketTransports } from "./mqtt/WebSocketTransports";
import { RS458Transports } from "./rs485/RS458Transports";


export function createConnection(type: ConnectionType) {
    switch (type) {
        case "Serial":
            return new RS458Transports();

        case "WS":
            return new WebSocketTransports();
        case "Bluetooth":
            return new BluetoothTransport();
        default:
            throw new Error("Unsupported connection");
    }
}