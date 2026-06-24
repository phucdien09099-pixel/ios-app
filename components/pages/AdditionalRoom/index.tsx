"use client";
import { v4 as uuid } from "uuid";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, CheckmarkCircle02Icon, QrCodeIcon } from "@hugeicons/core-free-icons";
import { roomRepo } from "@/db/repository/RoomRepository";
import { deviceRepo } from "@/db/repository/DeviceRepository";
import { BleDevice } from "@mnlphlp/plugin-blec";
import { bleService } from "@/utils/Tauri/BluetoothSerial";
import QrScanner from "qr-scanner";

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
    note: z.string().optional(),
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
    const [selectedHub, setSelectedHub] = useState<BleDevice | null>(null);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [qrVerified, setQrVerified] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const scannerRef = useRef<QrScanner | null>(null);
    const qrHandledRef = useRef(false);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { mode: "with_hub", name: "", note: "", ssid: "", pass: "" },
    });

    const currentMode = form.watch("mode");
    const hubSetupLocked = currentMode === "with_hub" && !selectedHub;
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
            } catch (e) { }
        };
    }, []);

    useEffect(() => {
        if (!scannerOpen || !videoRef.current) return;

        qrHandledRef.current = false;
        setCameraReady(false);
        setCameraError("");

        const scanner = new QrScanner(
            videoRef.current,
            async (result) => {
                if (qrHandledRef.current) return;

                const expectedUuid = process.env.NEXT_PUBLIC_SERVICE_UUID?.trim().toLowerCase();
                const scannedValue = result.data.trim().toLowerCase();

                if (!expectedUuid || scannedValue !== expectedUuid) {
                    setCameraError("QR không hợp lệ hoặc không thuộc Hub này");
                    return;
                }

                qrHandledRef.current = true;
                setQrVerified(true);
                setScannerOpen(false);
                toast.success("QR hợp lệ, đang tự động tìm Hub...");
                await searchHub(true);
            },
            {
                preferredCamera: "environment",
                highlightScanRegion: true,
                highlightCodeOutline: true,
                maxScansPerSecond: 8,
                returnDetailedScanResult: true,
            }
        );

        scannerRef.current = scanner;
        scanner.start().catch((error) => {
            console.error("Không thể mở camera sau:", error);
            setCameraError("Không thể mở camera. Vui lòng cấp quyền camera cho ứng dụng.");
        });

        return () => {
            scanner.stop();
            scanner.destroy();
            scannerRef.current = null;
        };
    }, [scannerOpen]);

    const startQrScanner = () => {
        setSelectedHub(null);
        setQrVerified(false);
        setCameraReady(false);
        setCameraError("");
        setScannerOpen(true);
    };

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
                            try {
                                await bleService.sendString(txCharacteristic, "device/restart|OK", "withResponse");
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
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

    const searchHub = async (autoSelect = false) => {
        try {
            setSearchingHub(true);
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
                if (autoSelect && matchingDevices.length > 0) {
                    const strongestHub = [...matchingDevices].sort(
                        (a, b) => (b.rssi ?? -999) - (a.rssi ?? -999)
                    )[0];
                    setSelectedHub(strongestHub);
                }
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

        const roomNote = data.note?.trim();

        await roomRepo.create({
            id: newRoomId,
            name: data.name,
            ...(roomNote ? { note: roomNote } : {}),
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
                        setScannerOpen(false);
                        setQrVerified(false);
                        setCameraError("");
                        setSelectedHub(null);
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
                {currentMode === "with_hub" && (
                    <div data-tour="scan-hub-qr" className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                                <HugeiconsIcon icon={QrCodeIcon} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-medium">Quét QR trên Hub</p>
                                <p className="text-xs text-muted-foreground">
                                    Dùng camera sau để xác thực và tự động chọn thiết bị.
                                </p>
                            </div>
                            {qrVerified ? <HugeiconsIcon icon={CheckmarkCircle02Icon} className="text-green-600" /> : null}
                        </div>

                        {scannerOpen ? (
                            <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
                                <video
                                    ref={videoRef}
                                    className="size-full object-cover"
                                    muted
                                    playsInline
                                    onCanPlay={() => setCameraReady(true)}
                                />
                                {!cameraReady ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                        <div className="flex size-20 items-center justify-center rounded-full bg-background ring-1 ring-border">
                                            <HugeiconsIcon icon={Camera01Icon} className="size-9 animate-pulse text-muted-foreground" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pointer-events-none absolute inset-[15%] rounded-xl border-2 border-white/80" />
                                )}
                            </div>
                        ) : null}

                        {cameraError ? <p className="text-xs text-destructive">{cameraError}</p> : null}

                        {selectedHub ? (
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-green-500 bg-green-50 p-3 dark:bg-green-900/20">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{selectedHub.name || "Smart Hub"}</p>
                                    <p className="truncate font-mono text-xs text-muted-foreground">{selectedHub.address}</p>
                                </div>
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="text-green-600" />
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 w-full rounded-xl"
                                disabled={searchingHub || loading}
                                onClick={scannerOpen ? () => setScannerOpen(false) : startQrScanner}
                            >
                                <HugeiconsIcon icon={scannerOpen ? Camera01Icon : QrCodeIcon} data-icon="inline-start" />
                                {scannerOpen ? "Đóng camera" : searchingHub ? "Đang tìm Hub..." : "Mở camera quét QR"}
                            </Button>
                        )}
                    </div>
                )}

                {/* ROOM INFO */}
                <div className="space-y-2" data-tour="room-name">
                    <label className="text-sm font-medium">Room name:</label>
                    <Input
                        id="input-room-name"
                        placeholder="Tên phòng (A101...)"
                        disabled={loading || hubSetupLocked}
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
                    <label className="text-sm font-medium">Room note (optional):</label>
                    <Input
                        id="input-room-note"
                        placeholder="Ghi chú về phòng này"
                        disabled={loading || hubSetupLocked}
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
                </div>

                {/* PHẦN CẤU HÌNH HUB & WIFI */}
                {currentMode === "with_hub" && (
                    <div className="space-y-5 border-t pt-5 border-dashed">
                        <div className="space-y-2" data-tour="wifi-ssid">
                            <label className="text-sm font-medium">SSID (Wi-Fi Name):</label>
                            <Input
                                id="input-wifi-ssid"
                                placeholder="Tên Wi-Fi nhà khách cấp cho Hub"
                                disabled={loading || hubSetupLocked}
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
                                disabled={loading || hubSetupLocked}
                                {...form.register("pass")}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        // 🟢 Gõ xong Wifi Pass, bấm Enter nó quét luôn!
                                        document.getElementById("submit-room-button")?.focus();
                                    }
                                }}
                            />
                            {form.formState.errors.pass && <p className="text-xs text-destructive">{form.formState.errors.pass.message}</p>}
                        </div>

                    </div>
                )}

                {/* SUBMIT BUTTON */}
                <div data-tour="submit-room">
                    <Button
                        id="submit-room-button"
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
