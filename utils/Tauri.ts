import { invoke } from "@tauri-apps/api/core";

export type COMProps = {
    ports: Ports[];
    count: number;
}
export type Ports = {
    manufacturer: string
    port_name: string
    port_type: string
    product: string
}

export const scanCOM = async (): Promise<COMProps[]> => { //* OK
    if (typeof window === "undefined") {
        // server side, không gọi invoke
        return [];
    }

    try {
        const ports = await invoke<COMProps[]>("scan_serial_ports");
        return ports;
    } catch (error) {
        console.error("Failed to scan COM ports:", error);
        return [];
    }
};

export const openCOM = async (config: any): Promise<any> => { //* OK
    return await invoke<string>("open_serial_port", { config })
}

export const closeCOM = async (): Promise<any> => { //* OK
    return await invoke<string>("close_serial_port");
}

export type ReadUntilStringConfig = {
    delimiter: string;      // String delimiter
    timeout_ms?: number;
};
export type ReadUntilString = {
    terminator: string;      // String delimiter
    timeout_ms?: number;
};
export const readSerialUntilChar = async (config: ReadUntilString) => { //* OK
    return await invoke<any>("read_until_char", config);
}
// export const readSerialUntilAnyChar = async (config: ReadSerialUntilChar) => { //* OK
//     return await invoke<any>("read_until_any_char", config);
// }
export const readSerialUntilString = async (config: ReadUntilStringConfig) => { //* OK
    return await invoke<any>("read_until_string", config);
}


// export type WriteSerial = {
//     portName: string;
//     data: string
// }
export const writeSerial = async (data: string) => {
    return await invoke<any>("write_serial_data", { data });
}