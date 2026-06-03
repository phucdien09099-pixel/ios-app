"use client";

import { NativeSelect, NativeSelectOption, } from "@/components/ui/native-select";
import { Link01Icon, Loading01Icon } from "@hugeicons/core-free-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { deviceRepo } from "@/db/repository/DeviceRepository";
import { Room } from "@/db/types/room";
import { useTransport } from "@/components/providers/transport/TransportProvider";

const schema = z.object({
    name: z.string().min(1),
    type: z.enum(["AC", "TV", "FAN", "LIGHT"]),
    brand: z.enum(["DAIKIN", "SAMSUNG", "LG", "XIAOMI"]),
});

type FormData = z.infer<typeof schema>;

export default function AddDeviceForm({ roomId }: { roomId: string }) {
    const [loading, setLoading] = useState(false);
    const [device, setDevice] = useState<any>();
    const { send } = useTransport();
    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            type: "AC",
            brand: "DAIKIN",
        },
    });


    const handlPairDevice = async (data: FormData) => {
        const payload = {
            ...data,
            power: "on"
        }
        await send(payload, "pair");
    }

    const onSaveDevice = async () => {
        try {
            const data = form.getValues();

            setLoading(true);

            await deviceRepo.createDevice({
                room_id: roomId,
                name: data.name,
                type: data.type,
                brand: data.brand,
                status: "online",
            });

            toast.success("Lưu thiết bị thành công 🎉");

            form.reset();

            setDevice(null);
        } catch (err) {
            console.error(err);

            toast.error("Không thể lưu thiết bị");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="max-w-md mx-auto mt-10 space-y-4">
            <form onSubmit={form.handleSubmit(handlPairDevice)} className="space-y-4">

                {/* NAME */}
                <Input
                    placeholder="Device name"
                    disabled={loading}
                    {...form.register("name")}
                />

                {/* TYPE */}
                <NativeSelect className="w-full"
                    value={form.watch("type")}
                    onChange={(e) =>
                        form.setValue("type", e.target.value as any, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                        })
                    }
                    disabled={loading}
                >
                    <NativeSelectOption value="AC">Air Conditioner</NativeSelectOption>
                    <NativeSelectOption value="TV">Television</NativeSelectOption>
                    <NativeSelectOption value="FAN">Fan</NativeSelectOption>
                    <NativeSelectOption value="LIGHT">Light</NativeSelectOption>
                    <NativeSelectOption value="SMART_SCHEDULE">Schedule</NativeSelectOption>
                    <NativeSelectOption value="RELAY">Relay</NativeSelectOption>
                </NativeSelect>

                {/* BRAND */}
                <NativeSelect className="w-full"
                    value={form.watch("brand")}
                    onChange={(e) =>
                        form.setValue("brand", e.target.value as any, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                        })
                    }
                    disabled={loading}
                >
                    <NativeSelectOption value="DAIKIN">Daikin</NativeSelectOption>
                    <NativeSelectOption value="SAMSUNG">Samsung</NativeSelectOption>
                    <NativeSelectOption value="LG">LG</NativeSelectOption>
                    <NativeSelectOption value="XIAOMI">Xiaomi</NativeSelectOption>
                </NativeSelect>

                {/* BUTTON */}
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white">
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <HugeiconsIcon icon={Loading01Icon} className="animate-spin" />
                            Đang test kết nối...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <HugeiconsIcon icon={Link01Icon} />
                            Kiểm tra kết nối
                        </span>
                    )}
                </Button>
                <Button onClick={onSaveDevice}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <span className="flex items-center gap-2">
                        <HugeiconsIcon icon={Link01Icon} />
                        Lưu Thiết Bị
                    </span>
                </Button>
            </form>
        </div>
    );
}