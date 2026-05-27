import { TransportsInterface } from "../TransportsInterface";

export interface MqttTransportInterface extends TransportsInterface {
    subscribe(topic: string): void;
    unsubscribe?(topic: string): void;
}