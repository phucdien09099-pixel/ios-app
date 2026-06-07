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
import { deviceRepo } from "@/db/repository/DeviceRepository";
import { BleDevice } from "@mnlphlp/plugin-blec";
import { bleService } from "@/utils/Tauri/BluetoothSerial";
import { getSignalDetails } from "@/components/common/GetSignal";

type DataInit = {
    name: string,
    ssid: string,
    ssid_pass: string;
    user: string;
    user_pass: string;
    time_zone: string;
}
// IMPORT instance bleService bạn vừa cung cấp

const schema = z.object({
    mode: z.enum(["with_hub", "empty_room"]),
    name: z.string().min(1, "Vui lòng nhập tên phòng"),
    note: z.string().min(1, "Vui lòng nhập ghi chú"),
    ssid: z.string().optional(),
    pass: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.mode === "with_hub") {
        if (!data.ssid || data.ssid.trim() === "") {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SSID không được để trống", path: ["ssid"] });
        }
        if (!data.pass || data.pass.length < 8) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mật khẩu wifi phải từ 8 ký tự", path: ["pass"] });
        }
    }
});

type FormData = z.infer<typeof schema>;

export default function AddRoom() {
    const [loading, setLoading] = useState(false);
    const [searchingHub, setSearchingHub] = useState(false);
    const [hubs, setHubs] = useState<BleDevice[]>([]);
    const [selectedHub, setSelectedHub] = useState<BleDevice | null>(null);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { mode: "with_hub", name: "", note: "", ssid: "", pass: "" },
    });

    const currentMode = form.watch("mode");
    const txCharacteristic = process.env.NEXT_PUBLIC_CHAR_UUID_TX!;

    useEffect(() => {
        return () => {
            bleService.disconnect().catch(console.error);
        };
    }, []);

    // 1. Logic cấu hình Hub - Nhận đúng payload kiểu DataInit từ onSubmit truyền sang
    const pairDevice = async (device: BleDevice, networkConfig: DataInit) => {
        await bleService.ensurePermissions();
        await bleService.connect(device.address);

        if (process.env.NEXT_PUBLIC_SERVICE_UUID) {
            bleService.setService(process.env.NEXT_PUBLIC_SERVICE_UUID);
        }

        // const rxCharacteristic = process.env.NEXT_PUBLIC_CHAR_UUID_RX; //RX
        // BỔ SUNG: Lấy thêm RX Characteristic từ .env để lắng nghe phản hồi

        if (!txCharacteristic) {
            await bleService.disconnect();
            throw new Error("Chưa cấu hình đầy đủ UUID_TX hoặc UUID_RX trong file .env");
        }

        const payloadString = JSON.stringify(networkConfig);
        const packet = `device/init|${payloadString}`;

        // Tạo một Promise để bao bọc quá trình Chờ phản hồi dữ liệu
        return new Promise<void>(async (resolve, reject) => {
            let timeoutId: NodeJS.Timeout;

            try {
                // Bước 1: Đăng ký lắng nghe kênh RX trước khi gửi lệnh
                console.log("--- ĐANG ĐĂNG KÝ LẮNG NGHE KÊNH RX ---");
                await bleService.subscribeString(txCharacteristic, async (response) => {
                    console.log("Phản hồi nhận được từ Hub:", response);
                    const sep = response.indexOf("|");
                    if (sep === -1) return;

                    const channel = response.slice(0, sep);
                    const payloadRaw = response.slice(sep + 1).trim();

                    if (channel === "device/res") {
                        clearTimeout(timeoutId); // 🟢 Xóa ngay bộ đếm Timeout vì thiết bị ĐÃ PHẢN HỒI

                        // Hủy lắng nghe để tránh lặp listener
                        await bleService.unsubscribe(txCharacteristic).catch(console.error);

                        if (payloadRaw.includes("OK")) {
                            // await toast.success("Hub xác nhận: Cấu hình mạng thành công! 📡");
                            // await bleService.disconnect().catch(console.error);
                            resolve(); // Kết thúc Promise thành công
                        } else {
                            // 🔴 XỬ LÝ KHI HUB BÁO THẤT BẠI (FAILED_TO_CONNECT_WIFI)
                            // await toast.error(`Cấu hình thất bại: Hub không kết nối được Wifi!`);
                            // await bleService.disconnect().catch(console.error);
                            setLoading(false);

                            // Kết thúc Promise bằng cách trả về lỗi để block `try/catch` ở ngoài bắt được
                            reject(new Error(`Hub báo lỗi cấu hình: ${payloadRaw}`));
                        }
                    }
                });

                // Bước 2: Thiết lập Timeout phòng trường hợp Hub bị đơ không phản hồi
                timeoutId = setTimeout(async () => {
                    console.log("--- QUÁ THỜI GIAN CHỜ PHẢN HỒI (TIMEOUT) ---");
                    await bleService.unsubscribe(txCharacteristic).catch(console.error);
                    await bleService.disconnect().catch(console.error);
                    reject(new Error("Quá thời gian chờ phản hồi từ thiết bị (Timeout 15s)"));
                }, 60000); // Chờ tối đa 15 giây

                // Bước 3: Tiến hành bắn gói tin cấu hình xuống kênh TX
                console.log("--- TIẾN HÀNH GỬI CẤU HÌNH XUỐNG TX ---");
                await bleService.sendString(txCharacteristic, packet, "withResponse");
            } catch (error) {
                clearTimeout(timeoutId!);
                // await bleService.disconnect().catch(console.error);
                reject(error);
            }
        });
    };

    // 2. Logic quét tìm Hub (Giữ nguyên logic sửa đổi từ phiên trước của bạn)
    const searchHub = async () => {
        try {
            setSearchingHub(true);
            setHubs([]);
            setSelectedHub(null);

            try {
                await bleService.stopScan();
            } catch (e) { }

            await bleService.ensurePermissions();

            await bleService.startScan((devices) => {
                const targetService = process.env.NEXT_PUBLIC_SERVICE_UUID;
                const matchingDevices = devices.filter((d) =>
                    d.services?.some(s => s.toLowerCase() === targetService?.toLowerCase())
                );
                setHubs(matchingDevices);
            });

            toast.success("Đang quét tìm thiết bị Hub gần đây...");

            setTimeout(async () => {
                try {
                    await bleService.stopScan();
                } catch (err) {
                    console.error("Lỗi khi dừng quét:", err);
                } finally {
                    setSearchingHub(false);
                }
            }, 6000);

        } catch (error) {
            console.error(error);
            toast.error("Không thể kích hoạt Bluetooth để quét thiết bị");
            setSearchingHub(false);
        }
    };

    useEffect(() => {
        bleService.onScanningUpdates((scanning) => {
            if (!scanning) setSearchingHub(false);
        });
    }, []);

    // 3. Logic Submit - Build object cấu hình chuẩn để nạp qua BLE
    const onSubmit = async (data: FormData) => {
        if (data.mode === "with_hub" && !selectedHub) {
            toast.error("Vui lòng tìm và chọn Hub để kết nối!");
            return;
        }

        setLoading(true);
        // try {
        await bleService.stopScan();
        const newRoomId = uuid();

        // Thực thi cấu hình phần cứng qua BLE
        if (data.mode === "with_hub" && selectedHub) {
            toast.info("Đang nạp thông tin mạng xuống Hub...");

            // Chuẩn hóa cấu trúc object đúng theo kiểu định dạng DataInit phần cứng yêu cầu
            const hubConfigPayload: DataInit = {
                name: data.name,
                ssid: data.ssid || "",
                ssid_pass: data.pass || "",
                user: "",                     // Thay đổi mặc định theo firmware của bạn
                user_pass: "",              // Thay đổi mặc định theo firmware của bạn
                time_zone: "Asia/Ho_Chi_Minh"       // Mặc định múi giờ Việt Nam
            };

            await pairDevice(selectedHub, hubConfigPayload);
        }

        // Lưu phòng vào SQLite nội bộ
        await roomRepo.create({
            id: newRoomId,
            name: data.name,
            note: data.note,
        });

        // Ghi nhận thực thể Hub vào bảng thiết bị
        if (data.mode === "with_hub" && selectedHub) {
            await deviceRepo.createDevice({
                room_id: newRoomId,
                parent_id: null,
                name: `${data.name}`,
                status: "online",
                type: "HUB",
                serial: selectedHub.address || selectedHub.name,
                brand: "SmartHub",
            });
        }

        toast.success("Tạo phòng và thiết lập Hub thành công");
        await bleService.sendString(txCharacteristic, "device/restart", "withResponse"); //!BUG NOT RECIVE BLE
        form.reset({ mode: data.mode, name: "", note: "", ssid: "", pass: "" });
        setHubs([]);
        setSelectedHub(null);
        // } catch (error: any) {
        //     console.error(error);
        //     toast.error(error.message || "Xảy ra lỗi cấu hình hệ thống");
        // } finally {
        //     setLoading(false);
        //     setSearchingHub(false);
        // }
    };

    return (
        <div className="max-w-xl mx-auto mt-10 space-y-6 px-4">
            {/* SWITCH MODE BUTTONS */}
            <div className="grid grid-cols-2 gap-2 bg-muted p-1.5 rounded-2xl">
                <button
                    type="button"
                    onClick={() => {
                        form.setValue("mode", "with_hub");
                        form.clearErrors();
                    }}
                    className={`py-2.5 text-sm font-medium rounded-xl transition-all ${currentMode === "with_hub"
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Tạo phòng + Cấu hình Hub
                </button>
                <button
                    type="button"
                    onClick={() => {
                        form.setValue("mode", "empty_room");
                        form.clearErrors();
                        setSelectedHub(null);
                        setHubs([]);
                        bleService.stopScan().catch(console.error);
                    }}
                    className={`py-2.5 text-sm font-medium rounded-xl transition-all ${currentMode === "empty_room"
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Chỉ tạo phòng trống
                </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* ROOM INFO */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Room name:</label>
                    <Input placeholder="Tên phòng (A101...)" disabled={loading} {...form.register("name")} />
                    {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Room note:</label>
                    <Input placeholder="Ghi chú về phòng này" disabled={loading} {...form.register("note")} />
                    {form.formState.errors.note && <p className="text-xs text-destructive">{form.formState.errors.note.message}</p>}
                </div>

                {/* PHẦN CẤU HÌNH HUB & WIFI */}
                {currentMode === "with_hub" && (
                    <div className="space-y-5 border-t pt-5 border-dashed">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">SSID (Wi-Fi Name):</label>
                            <Input placeholder="Tên Wi-Fi nhà khách cấp cho Hub" disabled={loading} {...form.register("ssid")} />
                            {form.formState.errors.ssid && <p className="text-xs text-destructive">{form.formState.errors.ssid.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password:</label>
                            <Input type="password" placeholder="Mật khẩu băng tần 2.4Ghz" disabled={loading} {...form.register("pass")} />
                            {form.formState.errors.pass && <p className="text-xs text-destructive">{form.formState.errors.pass.message}</p>}
                        </div>

                        {/* FIND HUB */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Hub Connection</label>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-12 rounded-2xl gap-2"
                                onClick={searchHub}
                                disabled={searchingHub || loading}>
                                <HugeiconsIcon icon={Search01Icon} size={18} className={searchingHub ? "animate-spin" : ""} />
                                {searchingHub ? "Searching Hub..." : "Find Hub"}
                            </Button>

                            {/* HUB LIST */}
                            {hubs.length > 0 && (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {hubs.map((device) => {
                                        const isSelected = selectedHub?.address === device.address;
                                        const signal = getSignalDetails(device.rssi);
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
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors
                                                            ${isSelected
                                                            ? "bg-green-100 dark:bg-green-900/30"
                                                            : "bg-stone-100 dark:bg-stone-800"
                                                        }`}>
                                                        <HugeiconsIcon
                                                            icon={signal.icon} // Thay đổi icon động
                                                            size={22}
                                                            className={isSelected ? "text-green-600" : signal.color} // Đổi màu icon động
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-left text-sm">{device.name || "Unknown Hub"}</p>
                                                        <p className="text-xs text-muted-foreground text-left font-mono">{device.address}</p>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} className="text-green-600" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SUBMIT BUTTON */}
                <Button
                    className="w-full h-12 rounded-2xl mt-4"
                    disabled={loading || (currentMode === "with_hub" && !selectedHub)}
                    type="submit">
                    {loading ? "Processing..." : currentMode === "with_hub" ? "Connect Hub & Create Room" : "Create Empty Room"}
                </Button>
            </form>
        </div>
    );
}
