"use client";
import { useState } from "react";
import { Device } from "../Room/DeviceCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CardContent } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption, } from "@/components/ui/native-select";
import { Add01Icon, PowerIcon, Delete02Icon, BulbIcon, Fan01Icon, Tv01Icon, Wifi01Icon, Router01Icon, BluetoothIcon, Link01Icon, CheckmarkCircle02Icon, Cancel01Icon, } from "@hugeicons/core-free-icons";

type IconType =
    | "LIGHT"
    | "FAN"
    | "TV"
    | "DEFAULT";

type SmartButton = {
    id: string;
    name: string;
    active: boolean;
    icon: IconType;
};

const icons = {
    LIGHT: BulbIcon,
    FAN: Fan01Icon,
    TV: Tv01Icon,
    DEFAULT: Wifi01Icon,
};

export function SmartSwitchController({ data }: { data: Device }) {
    const [buttons, setButtons] = useState<SmartButton[]>([
        {
            id: crypto.randomUUID(),
            name: "Living Room Light",
            active: true,
            icon: "LIGHT",
        },
        {
            id: crypto.randomUUID(),
            name: "Ceiling Fan",
            active: false,
            icon: "FAN",
        },
    ]);

    const [newName, setNewName] = useState("");
    const [selectedIcon, setSelectedIcon] =
        useState<IconType>("DEFAULT");

    const sendCommand = (payload: any) => {
        console.log("SEND MQTT", payload);
    };

    const toggleDevice = (id: string) => {
        setButtons((prev) =>
            prev.map((btn) => {
                if (btn.id !== id) return btn;

                const next = !btn.active;

                sendCommand({
                    type: "SWITCH",
                    id,
                    value: next,
                });

                return {
                    ...btn,
                    active: next,
                };
            })
        );
    };

    const addButton = () => {
        if (!newName.trim()) return;

        setButtons((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                name: newName,
                active: false,
                icon: selectedIcon,
            },
        ]);

        setNewName("");
        setSelectedIcon("DEFAULT");
    };

    const removeButton = (id: string) => {
        setButtons((prev) =>
            prev.filter((btn) => btn.id !== id)
        );
    };

    return (
        <CardContent className="p-4 mb-20 min-h-screen md:p-6">
            <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
                {/* LEFT PANEL */}
                <div className="space-y-4">

                    {/* HEADER */}
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Smart Switch
                        </h1>

                        <p className="text-sm text-muted-foreground mt-1">
                            Smart relay & switch controller
                        </p>
                    </div>

                    {/* ADD FORM */}
                    <div className="border rounded-3xl p-5 space-y-4 bg-card">

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Switch Name
                            </label>

                            <Input
                                placeholder="Living room light..."
                                value={newName}
                                onChange={(e) =>
                                    setNewName(e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Icon
                            </label>

                            <NativeSelect
                                value={selectedIcon}
                                onChange={(e) =>
                                    setSelectedIcon(
                                        e.target.value as IconType
                                    )
                                }
                            >
                                <NativeSelectOption value="LIGHT">
                                    Light
                                </NativeSelectOption>

                                <NativeSelectOption value="FAN">
                                    Fan
                                </NativeSelectOption>

                                <NativeSelectOption value="TV">
                                    TV
                                </NativeSelectOption>

                                <NativeSelectOption value="DEFAULT">
                                    Default
                                </NativeSelectOption>
                            </NativeSelect>
                        </div>

                        <Button
                            className="w-full h-12 rounded-2xl"
                            onClick={addButton}
                        >
                            <HugeiconsIcon
                                icon={Add01Icon}
                                size={18}
                            />

                            Add Switch
                        </Button>

                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="space-y-4">

                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            Devices
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            {buttons.length} switches
                        </p>
                    </div>

                    {/* SWITCH GRID */}
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                        {buttons.map((btn) => {
                            const Icon =
                                icons[btn.icon] || Wifi01Icon;

                            return (
                                <div
                                    key={btn.id}
                                    className="border rounded-3xl p-5 bg-card transition hover:shadow-md"
                                >

                                    <div className="flex items-center justify-between gap-4">

                                        {/* LEFT */}
                                        <div className="flex items-center gap-4 min-w-0">

                                            <div
                                                className={
                                                    btn.active
                                                        ? "text-green-600"
                                                        : "text-muted-foreground"
                                                }
                                            >
                                                <HugeiconsIcon
                                                    icon={Icon}
                                                    size={32}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-semibold text-base truncate">
                                                    {btn.name}
                                                </p>

                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {btn.active ? "ON" : "OFF"}
                                                </p>
                                            </div>

                                        </div>

                                        {/* RIGHT */}
                                        <div className="flex items-center gap-2 shrink-0">

                                            {/* POWER */}
                                            <Button
                                                size="icon"
                                                variant={
                                                    btn.active
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className={
                                                    btn.active
                                                        ? "size-14 rounded-3xl bg-green-600 hover:bg-green-700"
                                                        : "size-14 rounded-3xl"
                                                }
                                                onClick={() =>
                                                    toggleDevice(btn.id)
                                                }
                                            >
                                                <HugeiconsIcon
                                                    icon={PowerIcon}
                                                    size={26}
                                                />
                                            </Button>

                                            {/* DELETE */}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="rounded-2xl"
                                                onClick={() =>
                                                    removeButton(btn.id)
                                                }
                                            >
                                                <HugeiconsIcon
                                                    icon={Delete02Icon}
                                                    size={18}
                                                    className="text-red-500"
                                                />
                                            </Button>

                                        </div>

                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </CardContent>
    );
}


type ConnectionType =
    | "MQTT"
    | "BLUETOOTH"
    | "RS485";

export function SettingSwitchController() {
    const [type, setType] =
        useState<ConnectionType>("MQTT");

    const [loading, setLoading] =
        useState(false);

    const [mqtt, setMqtt] = useState({
        host: "broker.emqx.io",
        port: "1883",
        username: "",
        password: "",
        topic: "iot/hub",
    });

    const [bluetooth, setBluetooth] =
        useState({
            deviceName: "ESP32-HUB",
        });

    const [rs485, setRs485] =
        useState({
            baudrate: "9600",
            slaveId: "1",
        });

    const [connected, setConnected] =
        useState(false);

    const connect = async () => {
        try {
            setLoading(true);

            await new Promise((r) =>
                setTimeout(r, 1000)
            );

            setConnected(true);

            console.log({
                type,
                mqtt,
                bluetooth,
                rs485,
            });
        } finally {
            setLoading(false);
        }
    };

    const disconnect = () => {
        setConnected(false);
    };

    return (
        <CardContent className="p-6 space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-semibold">
                    Connection Settings
                </h1>

                <p className="text-sm text-muted-foreground mt-1">
                    Configure hub communication
                </p>
            </div>

            {/* CONNECTION TYPE */}
            <div className="space-y-3">

                <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Router01Icon} size={18} />

                    <p className="font-medium">
                        Connection Type
                    </p>
                </div>

                <NativeSelect
                    value={type}
                    onChange={(e) =>
                        setType(
                            e.target
                                .value as ConnectionType
                        )
                    }>
                    <NativeSelectOption value="MQTT">
                        MQTT
                    </NativeSelectOption>

                    <NativeSelectOption value="BLUETOOTH">
                        Bluetooth
                    </NativeSelectOption>

                    <NativeSelectOption value="RS485">
                        RS485
                    </NativeSelectOption>
                </NativeSelect>

            </div>

            {/* MQTT */}
            {type === "MQTT" && (
                <div className="space-y-4 rounded-3xl border p-4">

                    <div className="flex items-center gap-2">
                        <HugeiconsIcon
                            icon={Wifi01Icon}
                            size={18}
                        />

                        <p className="font-medium">
                            MQTT Broker
                        </p>
                    </div>

                    <Input
                        placeholder="Host"
                        value={mqtt.host}
                        onChange={(e) =>
                            setMqtt({
                                ...mqtt,
                                host: e.target.value,
                            })
                        }
                    />

                    <Input
                        placeholder="Port"
                        value={mqtt.port}
                        onChange={(e) =>
                            setMqtt({
                                ...mqtt,
                                port: e.target.value,
                            })
                        }
                    />

                    <Input
                        placeholder="Username"
                        value={mqtt.username}
                        onChange={(e) =>
                            setMqtt({
                                ...mqtt,
                                username:
                                    e.target.value,
                            })
                        }
                    />

                    <Input
                        type="password"
                        placeholder="Password"
                        value={mqtt.password}
                        onChange={(e) =>
                            setMqtt({
                                ...mqtt,
                                password:
                                    e.target.value,
                            })
                        }
                    />

                    <Input
                        placeholder="Topic"
                        value={mqtt.topic}
                        onChange={(e) =>
                            setMqtt({
                                ...mqtt,
                                topic:
                                    e.target.value,
                            })
                        }
                    />

                </div>
            )}

            {/* BLUETOOTH */}
            {type === "BLUETOOTH" && (
                <div className="space-y-4 rounded-3xl border p-4">

                    <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={BluetoothIcon} size={18} />

                        <p className="font-medium">
                            Bluetooth Device
                        </p>
                    </div>

                    <Input
                        placeholder="Device name"
                        value={
                            bluetooth.deviceName
                        }
                        onChange={(e) =>
                            setBluetooth({
                                deviceName:
                                    e.target.value,
                            })
                        }
                    />

                    <Button
                        variant="outline"
                        className="w-full rounded-2xl"
                    >
                        Scan Devices
                    </Button>

                </div>
            )}

            {/* RS485 */}
            {type === "RS485" && (
                <div className="space-y-4 rounded-3xl border p-4">

                    <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Link01Icon} size={18} />

                        <p className="font-medium">
                            RS485 Modbus
                        </p>
                    </div>

                    <Input
                        placeholder="Baudrate"
                        value={rs485.baudrate}
                        onChange={(e) =>
                            setRs485({
                                ...rs485,
                                baudrate:
                                    e.target.value,
                            })
                        }
                    />

                    <Input
                        placeholder="Slave ID"
                        value={rs485.slaveId}
                        onChange={(e) =>
                            setRs485({
                                ...rs485,
                                slaveId:
                                    e.target.value,
                            })
                        }
                    />

                </div>
            )}

            {/* STATUS */}
            <div className="rounded-3xl border p-4 flex items-center justify-between">

                <div>
                    <p className="font-medium">
                        Connection Status
                    </p>

                    <p className="text-sm text-muted-foreground">
                        {connected
                            ? "Connected"
                            : "Disconnected"}
                    </p>
                </div>

                <div
                    className={
                        connected
                            ? "text-green-600"
                            : "text-red-500"
                    }
                >
                    <HugeiconsIcon
                        icon={
                            connected
                                ? CheckmarkCircle02Icon
                                : Cancel01Icon
                        }
                        size={24}
                    />
                </div>

            </div>

            {/* ACTION */}
            <div className="flex gap-3">

                <Button
                    className="flex-1 h-12 rounded-2xl"
                    disabled={loading}
                    onClick={connect}
                >
                    {loading
                        ? "Connecting..."
                        : connected
                            ? "Reconnect"
                            : "Connect"}
                </Button>

                {connected && (
                    <Button
                        variant="destructive"
                        className="h-12 rounded-2xl"
                        onClick={disconnect}
                    >
                        Disconnect
                    </Button>
                )}

            </div>

        </CardContent>
    );
}