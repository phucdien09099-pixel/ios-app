
export type TransportMessage = {
    channel?: string;   // MQTT topic OR serial logical channel
    payload: any;
};

export interface TransportsInterface<TConfig = any, TData = Uint8Array | string> {
    autoConnect(config: any): Promise<any>;
    connect(config?: TConfig): Promise<any>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    send(message: TransportMessage): Promise<any>;
    onReceive(cb: (msg: TransportMessage) => void): void;
    onError?(callback: (err: Error) => void): void;
    scan(): Promise<TData[]>;

    restore?(config: any): Promise<void>;
}