"use client";
import { v4 as uuid } from "uuid";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Wifi01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { roomRepo } from "@/db/repository/RoomRepository";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import { BleDevice } from "@mnlphlp/plugin-blec";

const schema = z.object({
    name: z.string().min(1),
    note: z.string().min(1),
    ssid: z.string().min(1),
    pass: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export default function AddRoom() {
    const [loading, setLoading] = useState(false);
    const [searchingHub, setSearchingHub] = useState(false);
    const [hubs, setHubs] = useState<BleDevice[]>([]);
    const [selectedHub, setSelectedHub] = useState<BleDevice | null>(null);

    const { scan, connect, send, disconnect } = useTransport();

    const pairDevice = async (device: BleDevice, payload: any) => {
        await connect({
            device,
            txCharacteristic: process.env.NEXT_PUBLIC_CHAR_UUID_TX,
            serviceUUID: process.env.NEXT_PUBLIC_SERVICE_UUID,
        });
        await send(payload, "init");
    };

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { name: "", note: "", ssid: "", pass: "" },
    });

    const searchHub = async () => {
        try {
            setSearchingHub(true);
            setHubs([]);
            setSelectedHub(null);
            const devices = await scan();
            const matchingDevices = devices.filter((d: any) =>
                d.services?.includes(process.env.NEXT_PUBLIC_SERVICE_UUID)
            );
            console.log(matchingDevices)
            setHubs(matchingDevices);
            toast.success(`Found ${matchingDevices.length} hub(s)`);
        } catch {
            toast.error("No hub found");
        } finally {
            setSearchingHub(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        if (!selectedHub) return;
        await disconnect();
        setLoading(true);
        console.log(selectedHub)
        await pairDevice(selectedHub, data);
        await roomRepo.create({
            id: uuid(),
            name: data.name,
            note: data.note,
        });
        toast.success("Room created successfully 🎉");
        form.reset();
        setHubs([]);
        setSelectedHub(null);
        try {

        } catch {
            toast.error("Failed to create room");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10 space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* ROOM NAME */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Room name:</label>
                    <Input placeholder="Tên phòng (A101...)" disabled={loading} {...form.register("name")} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Room note:</label>
                    <Input placeholder="This is my room" disabled={loading} {...form.register("note")} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">SSID:</label>
                    <Input placeholder="Tên wifi" disabled={loading} {...form.register("ssid")} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Password:</label>
                    <Input placeholder="Mật khẩu wifi" disabled={loading} {...form.register("pass")} />
                </div>

                {/* FIND HUB */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Hub Connection</label>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 rounded-2xl"
                        onClick={searchHub}
                        disabled={searchingHub}>
                        <HugeiconsIcon icon={Search01Icon} size={18} />
                        {searchingHub ? "Searching Hub..." : "Find Hub"}
                    </Button>

                    {/* HUB LIST */}
                    {hubs.length > 0 && (
                        <div className="space-y-2">
                            {hubs.map((device) => {
                                const isSelected = selectedHub?.address === device.address;
                                return (
                                    <button
                                        key={device.address}
                                        type="button"
                                        onClick={() => setSelectedHub(device)}
                                        className={`w-full rounded-3xl border p-4 flex items-center justify-between transition-colors
                                            ${isSelected
                                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                : "hover:bg-muted"
                                            }`}>
                                        {/* LEFT */}
                                        <div className="flex items-center gap-3">
                                            <div className={`size-12 rounded-2xl flex items-center justify-center
                                                ${isSelected
                                                    ? "bg-green-100 dark:bg-green-900/30"
                                                    : "bg-muted"
                                                }`}>
                                                <HugeiconsIcon
                                                    icon={Wifi01Icon}
                                                    size={22}
                                                    className={isSelected ? "text-green-600" : "text-muted-foreground"} />
                                            </div>
                                            <p className="font-medium">{device.name}</p>
                                        </div>
                                        {/* RIGHT */}
                                        {isSelected && (
                                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} className="text-green-600" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <Button
                    className="w-full h-12 rounded-2xl"
                    disabled={loading || !selectedHub}
                    type="submit">
                    {loading ? "Creating..." : "Create Room"}
                </Button>
            </form>
        </div>
    );
}
