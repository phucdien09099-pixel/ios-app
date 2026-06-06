"use client";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Link01Icon, Loading01Icon, Tag01Icon, CpuIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { deviceRepo } from "@/db/repository/DeviceRepository";
import { useTransport } from "@/components/providers/transport/TransportProvider";

// 1. Cấu hình Zod Schema với đầy đủ 2 chế độ kết nối
const schema = z.object({
    name: z.string().min(1, "Vui lòng nhập tên thiết bị"),
    connectionType: z.enum(["IR_RF", "IOT_SUB"]),
    type: z.enum(["AC", "TV", "FAN", "LIGHT", "SMART_SCHEDULE", "RELAY"]),
    brand: z.string().optional(),
    iotDeviceId: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.connectionType === "IOT_SUB" && (!data.iotDeviceId || data.iotDeviceId.trim() === "")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Thiết bị IoT bắt buộc phải quét mã phần cứng (Serial)",
            path: ["iotDeviceId"]
        });
    }
});

type FormData = z.infer<typeof schema>;

export default function AddDeviceForm({ roomId, roomName }: { roomId: string, roomName: string }) {
    const [loading, setLoading] = useState(false);
    const [scanningIot, setScanningIot] = useState(false);
    const { send } = useTransport();

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            connectionType: "IR_RF",
            type: "AC",
            brand: "DAIKIN",
            iotDeviceId: "",
        },
    });

    const connectionType = form.watch("connectionType");
    const deviceName = form.watch("name");

    // Giả lập quét mã thiết bị IoT phần cứng
    const handleScanIotDevice = async () => {
        setScanningIot(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const mockIotId = "ZIG-RELAY-" + Math.random().toString(36).substr(2, 9).toUpperCase();

            form.setValue("iotDeviceId", mockIotId, { shouldValidate: true });
            toast.success("Đã tìm thấy thiết bị phần cứng IoT! 🎉");
        } catch {
            toast.error("Không tìm thấy thiết bị IoT nào ở chế độ ghép đôi");
        } finally {
            setScanningIot(false);
        }
    };

    // 🔥 HÀM TẠO PAYLOAD ĐỘNG: Phục vụ gửi MQTT theo trạng thái Tab đang chọn
    const createDynamicPayload = (data: FormData, msgType: "SCAN" | "CONFIRM") => {
        return {
            type: msgType,
            ir_devices: deviceName,
            // Nếu là IOT_SUB thì lấy mã cứng, nếu là IR_RF thì giả lập ID là 1 để mạch test sóng
            id: data.connectionType === "IOT_SUB" ? data.iotDeviceId : 1,
            brand: data.connectionType === "IR_RF" ? (data.brand || "MITSUBISHI") : "GENERIC_IOT",
            action: {
                power: "ON",
                temp: data.type === "AC" ? 24 : 0,
                mode: data.type === "AC" ? 1 : 0,
                fan: data.type === "AC" ? 0 : 0,
            }
        };
    };

    // CHỨC NĂNG 1: Bắn lệnh Test thử (Dùng type: "SCAN")
    const handlePairDevice = async (data: FormData) => {
        setLoading(true);
        try {
            const topic = `device/${roomName}/pair/set`;
            const dynamicPayload = createDynamicPayload(data, "SCAN");

            console.log("[MQTT SEND TEST]", { topic, dynamicPayload });

            await send(dynamicPayload, topic, "broadcast");
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success("Bắn lệnh kiểm tra (SCAN) thành công!");
        } catch (error) {
            console.error(error);
            toast.error("Kiểm tra kết nối thất bại");
        } finally {
            setLoading(false);
        }
    };

    // ================= XỬ LÝ CHÍNH: LOẠI BỎ LOGIC HUB KHI LƯU DB =================
    const onSaveDevice = async () => {
        const isValid = await form.trigger();
        if (!isValid) return;

        setLoading(true);
        try {
            const data = form.getValues();

            // 🔥 ĐÃ LOẠI BỎ hoàn toàn việc kiểm tra getByHubDevice.
            // Tất cả thiết bị (kể cả IR hay IoT) đều được lưu phẳng dạng độc lập tự trị.
            await deviceRepo.createDevice({
                room_id: roomId,
                parent_id: null, // Không phụ thuộc cấu hình cây phân cấp Hub cha nữa
                name: data.name,
                type: data.type as any,
                serial: data.connectionType === "IOT_SUB" ? data.iotDeviceId : null,
                brand: data.connectionType === "IR_RF" ? data.brand : "GENERIC_IOT",
                status: "online",
            });

            // Gửi lệnh xác nhận cấu hình xuống phần cứng
            const topic = `device/${roomName}/pair/set`;
            const dynamicPayload = createDynamicPayload(data, "CONFIRM");

            console.log("[MQTT SEND SAVE]", { topic, dynamicPayload });
            await send(dynamicPayload, topic, "broadcast");

            toast.success("Lưu thiết bị và cấu hình thành công (CONFIRM) 🎉");

            // Reset trạng thái form, giữ lại Tab hiện tại cho người dùng nhập tiếp thiết bị sau
            form.reset({
                name: "",
                connectionType: data.connectionType,
                type: "AC",
                brand: "DAIKIN",
                iotDeviceId: ""
            });
        } catch (err) {
            console.error(err);
            toast.error("Không thể lưu thiết bị vào cơ sở dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 space-y-5 px-4">
            {/* TAB CHỌN 2 LOẠI THIẾT BỊ (ĐÃ GIỮ LẠI) */}
            <div className="grid grid-cols-2 gap-2 bg-muted p-1.5 rounded-2xl">
                <button
                    type="button"
                    onClick={() => {
                        form.setValue("connectionType", "IR_RF");
                        form.clearErrors();
                    }}
                    className={`py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${connectionType === "IR_RF"
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}>
                    <HugeiconsIcon icon={Tag01Icon} size={15} />
                    Thiết bị Thường (IR/RF)
                </button>
                <button
                    type="button"
                    onClick={() => {
                        form.setValue("connectionType", "IOT_SUB");
                        form.setValue("brand", "XIAOMI");
                        form.clearErrors();
                    }}
                    className={`py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${connectionType === "IOT_SUB"
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <HugeiconsIcon icon={CpuIcon} size={15} />
                    Thiết bị IoT Phần Cứng
                </button>
            </div>

            <form onSubmit={form.handleSubmit(handlePairDevice)} className="space-y-4">
                {/* TÊN THIẾT BỊ */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Tên thiết bị:</label>
                    <Input
                        placeholder="Ví dụ: Điều hòa phòng khách, Công tắc âm tường"
                        disabled={loading}
                        {...form.register("name")}
                    />
                    {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>

                {/* LOẠI THIẾT BỊ */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Loại thiết bị:</label>
                    <NativeSelect
                        className="w-full"
                        value={form.watch("type")}
                        onChange={(e) => form.setValue("type", e.target.value as any, { shouldValidate: true })}
                        disabled={loading}
                    >
                        <NativeSelectOption value="AC">Air Conditioner (Điều hòa)</NativeSelectOption>
                        <NativeSelectOption value="TV">Television (Tivi)</NativeSelectOption>
                        <NativeSelectOption value="FAN">Fan (Quạt)</NativeSelectOption>
                        <NativeSelectOption value="LIGHT">Light (Đèn)</NativeSelectOption>
                        <NativeSelectOption value="SMART_SCHEDULE">Schedule (Bộ hẹn giờ)</NativeSelectOption>
                        <NativeSelectOption value="RELAY">Relay (Rơ-le điều khiển)</NativeSelectOption>
                    </NativeSelect>
                </div>

                {/* HIỂN THỊ ĐỘNG KHU VỰC THUỘC TÍNH THEO TAB CHỌN */}
                {connectionType === "IR_RF" ? (
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Hãng sản xuất (Brand):</label>
                        <NativeSelect
                            className="w-full"
                            value={form.watch("brand")}
                            onChange={(e) => form.setValue("brand", e.target.value, { shouldValidate: true })}
                            disabled={loading}
                        >
                            <NativeSelectOption value="DAIKIN">Daikin</NativeSelectOption>
                            <NativeSelectOption value="SAMSUNG">Samsung</NativeSelectOption>
                            <NativeSelectOption value="LG">LG</NativeSelectOption>
                            <NativeSelectOption value="XIAOMI">Xiaomi</NativeSelectOption>
                        </NativeSelect>
                    </div>
                ) : (
                    <div className="space-y-2 border p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/30 border-dashed">
                        <label className="text-xs font-medium text-muted-foreground block">Đồng bộ mã cứng IoT (ID/Serial):</label>

                        <div className="flex gap-2">
                            <Input
                                placeholder="Chưa liên kết mã phần cứng"
                                readOnly
                                className="bg-muted text-xs font-mono"
                                {...form.register("iotDeviceId")}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                disabled={scanningIot || loading}
                                onClick={handleScanIotDevice}
                                className="shrink-0 gap-1.5"
                            >
                                <HugeiconsIcon icon={Search01Icon} size={16} className={scanningIot ? "animate-spin" : ""} />
                                {form.watch("iotDeviceId") ? "Quét lại" : "Quét mã"}
                            </Button>
                        </div>
                        {form.formState.errors.iotDeviceId && (
                            <p className="text-xs text-destructive">{form.formState.errors.iotDeviceId.message}</p>
                        )}
                    </div>
                )}

                {/* HÀNG NÚT BẤM CHỨC NĂNG */}
                <div className="pt-2 space-y-2">
                    <Button
                        type="submit"
                        disabled={loading || scanningIot}
                        variant="secondary"
                        className="w-full h-11 rounded-xl"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <HugeiconsIcon icon={Loading01Icon} className="animate-spin" size={18} />
                                Đang xử lý...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <HugeiconsIcon icon={Link01Icon} size={18} />
                                Kiểm tra tín hiệu thiết bị (SCAN)
                            </span>
                        )}
                    </Button>

                    <Button
                        type="button"
                        onClick={onSaveDevice}
                        disabled={loading || scanningIot}
                        className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white"
                    >
                        Lưu Thiết Bị Vào Phòng (CONFIRM)
                    </Button>
                </div>
            </form>
        </div>
    );
}
