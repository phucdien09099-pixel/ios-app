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
import { Search01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { roomRepo } from "@/db/repository/RoomRepository";
import { deviceRepo } from "@/db/repository/DeviceRepository";
import { BleDevice } from "@mnlphlp/plugin-blec";
import { bleService } from "@/utils/Tauri/BluetoothSerial";
import { getSignalDetails } from "@/components/common/GetSignal";

import { startBackToHomeTour, startRoomTour, roomDriverObj, showHubNotFoundTour } from "@/components/onboarding/tours/roomTour";

type DataInit = {
    name: string,
    ssid: string,
    ssid_pass: string;
    user: string;
    user_pass: string;
    time_zone: string;
}

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
        const timer = setTimeout(() => {
            const targetElement = document.querySelector('[data-tour="room-name"]');
            if (targetElement) {
                try {
                    startRoomTour(false);
                } catch (error) {
                    console.error("Lỗi khi khởi chạy Room Tour:", error);
                }
            }
        }, 700); 

        return () => {
            clearTimeout(timer);
            bleService.disconnect().catch(console.error);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (localStorage.getItem("JUST_CREATED_ROOM_ID")) {
                window.dispatchEvent(new Event("room-created"));
            }
            if (roomDriverObj) {
                roomDriverObj.destroy();
            }
            try {
                document.body.classList.remove('driver-active');
                document.body.style.overflow = '';
                document.body.style.pointerEvents = '';
            } catch (e) {}
        };
    }, []);

    const pairDevice = async (device: BleDevice, networkConfig: DataInit) => {
        await bleService.ensurePermissions();
        await bleService.connect(device.address);

        if (process.env.NEXT_PUBLIC_SERVICE_UUID) {
            bleService.setService(process.env.NEXT_PUBLIC_SERVICE_UUID);
        }

        if (!txCharacteristic) {
            await bleService.disconnect();
            throw new Error("Chưa cấu hình đầy đủ UUID_TX hoặc UUID_RX trong file .env");
        }

        const payloadString = JSON.stringify(networkConfig);
        const packet = `device/init|${payloadString}`;

        return new Promise<void>(async (resolve, reject) => {
            let timeoutId: NodeJS.Timeout;

            try {
                console.log("--- ĐANG ĐĂNG KÝ LẮNG NGHE KÊNH RX ---");
                await bleService.subscribeString(txCharacteristic, async (response) => {
                    console.log("Phản hồi nhận được từ Hub:", response);
                    const sep = response.indexOf("|");
                    if (sep === -1) return;

                    const channel = response.slice(0, sep);
                    const payloadRaw = response.slice(sep + 1).trim();

                    if (channel === "device/res") {
                        clearTimeout(timeoutId);
                        await bleService.unsubscribe(txCharacteristic).catch(console.error);

                        if (payloadRaw.includes("OK")) {
                            resolve();
                        } else {
                            setLoading(false);
                            reject(new Error(`Hub báo lỗi cấu hình: ${payloadRaw}`));
                        }
                    }
                });

                timeoutId = setTimeout(async () => {
                    console.log("--- QUÁ THỜI GIAN CHỜ PHẢN HỒI (TIMEOUT) ---");
                    await bleService.unsubscribe(txCharacteristic).catch(console.error);
                    await bleService.disconnect().catch(console.error);
                    reject(new Error("Quá thời gian chờ phản hồi từ thiết bị (Timeout 15s)"));
                }, 60000);

                console.log("--- TIẾN HÀNH GỬI CẤU HÌNH XUỐNG TX ---");
                await bleService.sendString(txCharacteristic, packet, "withResponse");
            } catch (error) {
                clearTimeout(timeoutId!);
                reject(error);
            }
        });
    };

    const searchHub = async () => {
        try {
            setSearchingHub(true);
            setHubs([]);
            setSelectedHub(null);

            try {
                await bleService.stopScan();
            } catch (e) { }

            await bleService.ensurePermissions();

            // 🟢 Biến cờ (flag) để kiểm tra xem có quét ra được Hub nào không
            let foundAny = false;

            await bleService.startScan((devices) => {
                const targetService = process.env.NEXT_PUBLIC_SERVICE_UUID;
                const matchingDevices = devices.filter((d) =>
                    d.services?.some(s => s.toLowerCase() === targetService?.toLowerCase())
                );
                setHubs(matchingDevices);
                if (matchingDevices.length > 0) foundAny = true; // Ghi nhận là có tìm thấy
            });

            toast.success("Đang quét tìm thiết bị Hub gần đây...");

            setTimeout(async () => {
                try {
                    await bleService.stopScan();
                } catch (err) {
                    console.error("Lỗi khi dừng quét:", err);
                } finally {
                    setSearchingHub(false);
                    
                    if (!foundAny) {
                        // Nếu không có, hiện popup thông báo ảnh lỗi độc lập
                        showHubNotFoundTour(); 
                    } else {
                        // Nếu CÓ thiết bị:
                        if (roomDriverObj) {
                            // 🟢 Đợi 1 nhịp ngắn (~100ms) để React cập nhật DOM (đổi css từ hidden sang block)
                            setTimeout(() => {
                                roomDriverObj.moveNext(); // Chuyển sang bước highlight [data-tour="hub-list-container"]
                            }, 100);
                        }
                    }
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

    const onSubmit = async (data: FormData) => {
        if (data.mode === "with_hub" && !selectedHub) {
            toast.error("Vui lòng tìm và chọn Hub để kết nối!");
            return;
        }

        setLoading(true);
        await bleService.stopScan();
        const newRoomId = uuid();

        if (data.mode === "with_hub" && selectedHub) {
            toast.info("Đang nạp thông tin mạng xuống Hub...");

            const hubConfigPayload: DataInit = {
                name: data.name,
                ssid: data.ssid || "",
                ssid_pass: data.pass || "",
                user: "",                    
                user_pass: "",              
                time_zone: "Asia/Ho_Chi_Minh"       
            };

            await pairDevice(selectedHub, hubConfigPayload);
        }

        await roomRepo.create({
            id: newRoomId,
            name: data.name,
            note: data.note,
        });

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
        await bleService.sendString(txCharacteristic, "device/restart", "withResponse");

        localStorage.setItem("JUST_CREATED_ROOM_ID", newRoomId); 
        setTimeout(() => startBackToHomeTour(), 500);

        // form.reset({ mode: data.mode, name: "", note: "", ssid: "", pass: "" });
        // setHubs([]);
        // setSelectedHub(null);
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
                <div className="space-y-2" data-tour="room-name">
                    <label className="text-sm font-medium">Room name:</label>
                    <Input 
                        id="input-room-name"
                        placeholder="Tên phòng (A101...)" 
                        disabled={loading} 
                        {...form.register("name")} 
                        // 🟢 TỰ ĐỘNG CHUYỂN Ô KHI NHẤN ENTER
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                document.getElementById('input-room-note')?.focus();
                            }
                        }}
                    />
                    {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>

                <div className="space-y-2" data-tour="room-note">
                    <label className="text-sm font-medium">Room note:</label>
                    <Input 
                        id="input-room-note"
                        placeholder="Ghi chú về phòng này" 
                        disabled={loading} 
                        {...form.register("note")} 
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (currentMode === 'with_hub') {
                                    document.getElementById('input-wifi-ssid')?.focus();
                                }
                            }
                        }}
                    />
                    {form.formState.errors.note && <p className="text-xs text-destructive">{form.formState.errors.note.message}</p>}
                </div>

                {/* PHẦN CẤU HÌNH HUB & WIFI */}
                {currentMode === "with_hub" && (
                    <div className="space-y-5 border-t pt-5 border-dashed">
                        <div className="space-y-2" data-tour="wifi-ssid">
                            <label className="text-sm font-medium">SSID (Wi-Fi Name):</label>
                            <Input 
                                id="input-wifi-ssid"
                                placeholder="Tên Wi-Fi nhà khách cấp cho Hub" 
                                disabled={loading} 
                                {...form.register("ssid")} 
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        document.getElementById('input-wifi-pass')?.focus();
                                    }
                                }}
                            />
                            {form.formState.errors.ssid && <p className="text-xs text-destructive">{form.formState.errors.ssid.message}</p>}
                        </div>

                        <div className="space-y-2" data-tour="wifi-password">
                            <label className="text-sm font-medium">Password:</label>
                            <Input 
                                id="input-wifi-pass"
                                type="password" 
                                placeholder="Mật khẩu băng tần 2.4Ghz" 
                                disabled={loading} 
                                {...form.register("pass")} 
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        // 🟢 Gõ xong Wifi Pass, bấm Enter nó quét luôn!
                                        searchHub();
                                    }
                                }}
                            />
                            {form.formState.errors.pass && <p className="text-xs text-destructive">{form.formState.errors.pass.message}</p>}
                        </div>

                        {/* FIND HUB */}
                        <div className="space-y-3" data-tour="find-hub-area">
                            <label className="text-sm font-medium">Hub Connection</label>

                            <Button
                                data-tour="find-hub-btn"
                                type="button"
                                variant="outline"
                                className="w-full h-12 rounded-2xl gap-2"
                                onClick={searchHub}
                                disabled={searchingHub || loading}>
                                <HugeiconsIcon icon={Search01Icon} size={18} className={searchingHub ? "animate-spin" : ""} />
                                {searchingHub ? "Searching Hub..." : "Find Hub"}
                            </Button>

                            <div 
                                data-tour="hub-list-container" 
                                className={`space-y-2 max-h-48 overflow-y-auto pr-1 transition-all ${
                                    hubs.length > 0 ? "block" : "hidden"
                                }`}
                            >
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
                                                        icon={signal.icon}
                                                        size={22}
                                                        className={isSelected ? "text-green-600" : signal.color}
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
                        </div>
                    </div>
                )}

                {/* SUBMIT BUTTON */}
                <div data-tour="submit-room">
                    <Button
                        className="w-full h-12 rounded-2xl mt-4"
                        disabled={loading || (currentMode === "with_hub" && !selectedHub)}
                        type="submit">
                        {loading ? "Đang xử lý..." : currentMode === "with_hub" ? "Connect Hub & Create Room" : "Create Empty Room"}
                    </Button>
                </div>
            </form>
        </div>
    );
}