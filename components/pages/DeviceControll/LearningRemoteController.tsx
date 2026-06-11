"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import { cn } from "@/libs/utils";

import { HugeiconsIcon } from "@hugeicons/react";
import {
    Add01Icon,
    AiLearningIcon,
    ArrowDown01Icon,
    ArrowLeft01Icon,
    ArrowRight01Icon,
    ArrowUp01Icon,
    BulbIcon,
    Cancel01Icon,
    CheckmarkCircle02Icon,
    Delete02Icon,
    Edit02Icon,
    Fan01Icon,
    Home01Icon,
    Menu01Icon,
    PauseIcon,
    PlayIcon,
    PowerIcon,
    RemoteControlIcon,
    SaveIcon,
    Settings02Icon,
    StopIcon,
    Tv01Icon,
    VolumeHighIcon,
    VolumeLowIcon,
    VolumeMute01Icon,
} from "@hugeicons/core-free-icons";

import { Device } from "../Room/DeviceCard";

const ICON_OPTIONS = [
    { key: "power", label: "Power", icon: PowerIcon },
    { key: "play", label: "Play", icon: PlayIcon },
    { key: "pause", label: "Pause", icon: PauseIcon },
    { key: "stop", label: "Stop", icon: StopIcon },
    { key: "up", label: "Up", icon: ArrowUp01Icon },
    { key: "down", label: "Down", icon: ArrowDown01Icon },
    { key: "left", label: "Left", icon: ArrowLeft01Icon },
    { key: "right", label: "Right", icon: ArrowRight01Icon },
    { key: "volume-high", label: "Volume up", icon: VolumeHighIcon },
    { key: "volume-low", label: "Volume down", icon: VolumeLowIcon },
    { key: "mute", label: "Mute", icon: VolumeMute01Icon },
    { key: "home", label: "Home", icon: Home01Icon },
    { key: "menu", label: "Menu", icon: Menu01Icon },
    { key: "settings", label: "Settings", icon: Settings02Icon },
    { key: "tv", label: "TV", icon: Tv01Icon },
    { key: "fan", label: "Fan", icon: Fan01Icon },
    { key: "light", label: "Light", icon: BulbIcon },
    { key: "remote", label: "Remote", icon: RemoteControlIcon },
] as const;

type RemoteIconKey = (typeof ICON_OPTIONS)[number]["key"];

type LearnedButton = {
    id: string;
    name: string;
    codeKey: string;
    iconKey: RemoteIconKey;
    learned: boolean;
    updatedAt: string;
    dataBase64?: string;
};

const DEFAULT_BUTTONS: LearnedButton[] = [
    { id: "power", name: "Power", codeKey: "POWER", iconKey: "power", learned: false, updatedAt: "" },
    { id: "mode", name: "Mode", codeKey: "MODE", iconKey: "settings", learned: false, updatedAt: "" },
    { id: "up", name: "Up", codeKey: "UP", iconKey: "up", learned: false, updatedAt: "" },
    { id: "down", name: "Down", codeKey: "DOWN", iconKey: "down", learned: false, updatedAt: "" },
    { id: "left", name: "Left", codeKey: "LEFT", iconKey: "left", learned: false, updatedAt: "" },
    { id: "right", name: "Right", codeKey: "RIGHT", iconKey: "right", learned: false, updatedAt: "" },
];

const normalizeCodeKey = (value: string) =>
    value
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toUpperCase();

const getIconOption = (key: RemoteIconKey) => ICON_OPTIONS.find((item) => item.key === key) ?? ICON_OPTIONS[0];

const migrateButtons = (value: unknown): LearnedButton[] | null => {
    if (!Array.isArray(value)) return null;

    return value
        .filter((item) => item && typeof item === "object")
        .map((item: any) => ({
            id: String(item.id || crypto.randomUUID()),
            name: String(item.name || "Button"),
            codeKey: normalizeCodeKey(String(item.codeKey || item.name || "BUTTON")),
            iconKey: ICON_OPTIONS.some((option) => option.key === item.iconKey) ? item.iconKey : "remote",
            learned: Boolean(item.learned),
            dataBase64: item.dataBase64 ? String(item.dataBase64) : undefined,
            updatedAt: String(item.updatedAt || ""),
        }));
};

export default function LearningRemoteController({ data, roomName }: { data: Device; roomName: string }) {
    const storageKey = useMemo(() => `learning-remote:${data.id}:buttons`, [data.id]);
    const [buttons, setButtons] = useState<LearnedButton[]>(DEFAULT_BUTTONS);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [name, setName] = useState("");
    const [codeKey, setCodeKey] = useState("");
    const [iconKey, setIconKey] = useState<RemoteIconKey>("remote");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [learnMode, setLearnMode] = useState(false);
    const [learningId, setLearningId] = useState<string | null>(null);
    const [sendingId, setSendingId] = useState<string | null>(null); // Trạng thái nút đang gửi sóng IR đi
    const [successId, setSuccessId] = useState<string | null>(null); // Trạng thái nút vừa nhận SEND_LEARNING thành công
    const { send, lastMessage } = useTransport();

    // 🔄 Vòng lặp Effect xử lý các bản tin thời gian thực đổ về từ Socket/MQTT
    useEffect(() => {
        if (!lastMessage) return;

        try {
            // 1. Giải mã Payload cấp 1
            let messagePayload: any = null;
            if (typeof lastMessage.payload === "string") {
                messagePayload = JSON.parse(lastMessage.payload);
            } else if (lastMessage.payload && typeof lastMessage.payload === "object") {
                messagePayload = lastMessage.payload;
            }

            // Giải mã Payload cấp 2 nếu bị bọc chuỗi (Lồng nhau)
            if (messagePayload && typeof messagePayload.payload === "string") {
                messagePayload = JSON.parse(messagePayload.payload);
            } else if (messagePayload && typeof messagePayload.payload === "object") {
                messagePayload = messagePayload.payload;
            }

            // TRƯỜNG HỢP 1: Nhận chuỗi base64 học từ thiết bị gửi lên
            if (learnMode && learningId && messagePayload?.type === "SEND_LEARNING") {
                console.log("📨 [LearningRemote] Nhận được gói tin SEND_LEARNING từ thiết bị.");
                const incomingBase64 = messagePayload.action?.dataBase64;

                if (incomingBase64) {
                    console.log("🔑 [LearningRemote] Lấy chuỗi base64 thành công:", incomingBase64);
                    const currentLearningId = learningId; // Ghim lại id đang xử lý

                    // Tiến hành cập nhật dữ liệu vào mảng Buttons state
                    setButtons((current) =>
                        current.map((item) =>
                            item.id === currentLearningId
                                ? {
                                    ...item,
                                    learned: true,
                                    dataBase64: incomingBase64,
                                    updatedAt: new Date().toISOString(),
                                }
                                : item
                        )
                    );

                    // Hiển thị thông báo kèm thông số độ dài chuỗi để xác thực dữ liệu thực tế
                    toast.success(`🎉 Đã học thành công! Nhận được ${incomingBase64.length} ký tự mã IR.`);

                    // Kích hoạt trạng thái chuyển đổi màu xanh lá thành công trực quan trên nút
                    setSuccessId(currentLearningId);
                    setLearningId(null); // Giải phóng nút khỏi trạng thái chờ (hết nhấp nháy đỏ)

                    // Giữ màu xanh lá báo hiệu trong 2 giây rồi đưa nút về bình thường
                    setTimeout(() => {
                        setSuccessId((prev) => (prev === currentLearningId ? null : prev));
                    }, 2000);
                } else {
                    console.warn("⚠️ [LearningRemote] Đúng type SEND_LEARNING nhưng trường 'action.dataBase64' trống hoặc lỗi cấu trúc JSON.");
                }
            }

            // TRƯỜNG HỢP 2: Lắng nghe phản hồi lệnh phát sóng thành công từ ESP32 (Nếu mạch có trả ACK về)
            if (messagePayload?.type === "REMOTE_ACK" || messagePayload?.type === "SEND_SUCCESS") {
                console.log("🚀 [LearningRemote] Mạch xác nhận đã phát xung IR hoàn tất.");
                setSendingId(null);
            }

        } catch (error) {
            console.error("❌ [LearningRemote] Lỗi nghiêm trọng khi bóc tách gói tin IR:", error);
        }
    }, [lastMessage, learnMode, learningId]);

    // Đồng bộ LocalStorage
    useEffect(() => {
        const saved = window.localStorage.getItem(storageKey);
        if (!saved) return;
        try {
            const parsed = migrateButtons(JSON.parse(saved));
            if (parsed) setButtons(parsed);
        } catch {
            window.localStorage.removeItem(storageKey);
        }
    }, [storageKey]);

    useEffect(() => {
        window.localStorage.setItem(storageKey, JSON.stringify(buttons));
    }, [buttons, storageKey]);

    const resetForm = () => {
        setName("");
        setCodeKey("");
        setIconKey("remote");
        setEditingId(null);
    };

    const openCreateDialog = () => {
        resetForm();
        setDialogOpen(true);
    };

    const openEditDialog = (button: LearnedButton) => {
        setEditingId(button.id);
        setName(button.name);
        setCodeKey(button.codeKey);
        setIconKey(button.iconKey);
        setDialogOpen(true);
    };

    const sendRemotePayload = async (action: Record<string, any>) => {
        const payload = {
            type: "LEARNING_REMOTE",
            deviceName: data.name,
            brand: data.brand || "CUSTOM",
            action,
        };
        await send(payload, `device/${roomName}/control/set`);
    };

    const saveButton = () => {
        const trimmedName = name.trim();
        const normalizedCodeKey = normalizeCodeKey(codeKey || name);

        if (!trimmedName || !normalizedCodeKey) {
            toast.error("Vui lòng nhập tên nút");
            return;
        }

        setButtons((current) => {
            if (editingId) {
                return current.map((button) =>
                    button.id === editingId
                        ? { ...button, name: trimmedName, codeKey: normalizedCodeKey, iconKey, updatedAt: new Date().toISOString() }
                        : button
                );
            }
            return [
                ...current,
                { id: crypto.randomUUID(), name: trimmedName, codeKey: normalizedCodeKey, iconKey, learned: false, updatedAt: new Date().toISOString() },
            ];
        });

        resetForm();
        setDialogOpen(false);
    };

    const deleteButton = (buttonId: string) => {
        setButtons((current) => current.filter((button) => button.id !== buttonId));
        if (editingId === buttonId) resetForm();
    };

    // Kích hoạt học lệnh riêng cho từng nút
    const learnButton = async (button: LearnedButton) => {
        setLearningId(button.id);
        try {
            await sendRemotePayload({
                command: "LEARN",
                key: button.codeKey,
                name: button.name,
            });
            toast.info(`Chế độ học: Hãy ấn nút trên Remote thật hướng vào mắt thu của thiết bị...`);
        } catch (error) {
            console.error(error);
            toast.error("Không thể gửi lệnh học nút");
            setLearningId(null);
        }
    };

    // Bắn mã Base64 xuống thiết bị phần cứng để phát sóng điều khiển
    const runButton = async (button: LearnedButton) => {
        if (!button.learned || !button.dataBase64) {
            toast.error(`Nút ${button.name} chưa được học lệnh hồng ngoại!`);
            return;
        }

        setSendingId(button.id); // Kích hoạt nhấp nháy xanh dương lập tức khi nhấn
        try {
            if (button.learned) {
                await sendRemotePayload({
                    dataBase64: button.dataBase64,
                });
                toast.success(`Đã phát lệnh nút ${button.name}`);
            }

            // Tự động giải phóng hiệu ứng nhấp nháy xanh sau 800ms phòng trường hợp không có ACK mạng từ ESP
            setTimeout(() => {
                setSendingId((prev) => (prev === button.id ? null : prev));
            }, 800);
        } catch (error) {
            console.error(error);
            toast.error("Không thể gửi lệnh remote");
            setSendingId(null);
        }
    };

    const onRemoteButtonClick = (button: LearnedButton) => {
        if (editMode) {
            openEditDialog(button);
            return;
        }
        if (learnMode) {
            learnButton(button);
            return;
        }
        runButton(button);
    };

    const toggleLearnMode = async () => {
        const nextState = !learnMode;
        setLearnMode(nextState);
        setEditMode(false);

        // Đã sửa lỗi chính tả payload hệ thống (Thêm G) cho đồng bộ firmware
        const learningPayload = {
            type: nextState ? "START_LEARNIN" : "STOP_LEARNIN",
            id: data.id || 1,
            deviceName: data.name || "HUB1",
            brand: data.brand || "MITSUBISHI",
            action: {},
        };

        try {
            await send(learningPayload, `device/${roomName}/control/set`);
            if (nextState) {
                toast.info("Đã kích hoạt chế độ học lệnh trên thiết bị");
            } else {
                toast.warning("Đã tắt chế độ học lệnh");
                setLearningId(null);
            }
        } catch (error) {
            console.error("❌ Lỗi thay đổi trạng thái học lệnh tổng thể:", error);
            toast.error("Không thể đồng bộ chế độ học lệnh với thiết bị");
            setLearnMode(learnMode);
        }
    };

    return (
        <CardContent className="flex flex-col gap-4 p-4 md:p-6">
            {/* Header thông tin điều khiển */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <h1 className="truncate text-xl font-semibold">{data.name}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={learnMode ? "default" : "outline"}>Learning mode</Badge>
                        <Badge variant={editMode ? "default" : "outline"}>{buttons.length} buttons</Badge>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <Button size="icon-lg" variant="outline" title="Thêm nút" aria-label="Thêm nút" onClick={openCreateDialog}>
                        <HugeiconsIcon icon={Add01Icon} />
                    </Button>
                    <Button
                        size="icon-lg"
                        variant={editMode ? "default" : "outline"}
                        title="Sửa nút"
                        aria-label="Sửa nút"
                        onClick={() => {
                            setEditMode((value) => !value);
                            setLearnMode(false);
                        }}
                    >
                        <HugeiconsIcon icon={Edit02Icon} />
                    </Button>
                    <Button
                        size="icon-lg"
                        variant={learnMode ? "default" : "outline"}
                        title="Học nút"
                        aria-label="Học nút"
                        onClick={toggleLearnMode}
                    >
                        <HugeiconsIcon icon={AiLearningIcon} className={cn(learnMode && "animate-pulse")} />
                    </Button>
                </div>
            </div>

            {/* Grid danh sách nút bấm điều khiển */}
            <div className="grid grid-cols-2 gap-3">
                {buttons.map((button) => {
                    const iconOption = getIconOption(button.iconKey);
                    const isLearning = learningId === button.id;
                    const isSending = sendingId === button.id;
                    const isSuccess = successId === button.id; // Kiểm tra trạng thái đã nhận dữ liệu từ ESP32

                    return (
                        <div key={button.id} className="relative">
                            <Button
                                variant={button.learned ? "secondary" : "outline"}
                                className={cn(
                                    "h-28 w-full flex-col gap-3 rounded-lg transition-all duration-300",
                                    learnMode && "ring-2 ring-orange-500/30",
                                    // 🔴 TRẠNG THÁI CHỜ HỌC: Nhấp nháy viền Đỏ
                                    isLearning && "animate-pulse ring-2 ring-destructive bg-destructive/10 text-destructive",
                                    // 🔵 TRẠNG THÁI PHÁT LỆNH: Nhấp nháy viền Xanh Dương
                                    isSending && "animate-pulse ring-2 ring-primary bg-primary/10 text-primary scale-95",
                                    // 🟢 TRẠNG THÁI THÀNH CÔNG: Đổi sang màu Xanh Lá trong 2 giây khi nhận được dữ liệu base64
                                    isSuccess && "ring-4 ring-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold scale-105"
                                )}
                                disabled={isLearning}
                                onClick={() => onRemoteButtonClick(button)}
                            >
                                {/* Nếu học thành công, đổi icon tạm thời sang hình check-mark */}
                                <HugeiconsIcon
                                    icon={isSuccess ? CheckmarkCircle02Icon : iconOption.icon}
                                    className={cn("size-8 transition-transform", isSuccess && "animate-bounce text-emerald-500", isSending && "scale-110 text-primary")}
                                />
                                <span className="max-w-full truncate text-sm font-medium">
                                    {isSuccess ? "ĐÃ NHẬN!" : button.name}
                                </span>
                            </Button>

                            {/* Dấu tích góc trái cố định báo hiệu nút này đã hoàn thành học lệnh */}
                            {button.learned && !isSuccess ? (
                                <div className="absolute top-2 left-2 flex size-5 items-center justify-center rounded-full bg-background ring-1 ring-border">
                                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3 text-emerald-500" />
                                </div>
                            ) : null}

                            {editMode ? (
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <Button
                                        size="icon-xs"
                                        variant="outline"
                                        title="Sửa"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            openEditDialog(button);
                                        }}
                                    >
                                        <HugeiconsIcon icon={Edit02Icon} />
                                    </Button>
                                    <Button
                                        size="icon-xs"
                                        variant="destructive"
                                        title="Xóa"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            deleteButton(button.id);
                                        }}
                                    >
                                        <HugeiconsIcon icon={Delete02Icon} />
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            {/* Dialog Form Thêm/Sửa thông tin nút */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) resetForm();
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Sửa nút remote" : "Thêm nút remote"}</DialogTitle>
                        <DialogDescription>Chọn icon và đặt mã nút để học hoặc gửi lại tín hiệu.</DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="remote-button-name">Tên nút</FieldLabel>
                            <Input
                                id="remote-button-name"
                                placeholder="Ví dụ: Power, Fan, HDMI"
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);
                                    if (!editingId) setCodeKey(normalizeCodeKey(event.target.value));
                                }}
                            />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="remote-button-code">Mã nút</FieldLabel>
                            <Input
                                id="remote-button-code"
                                placeholder="POWER"
                                value={codeKey}
                                onChange={(event) => setCodeKey(normalizeCodeKey(event.target.value))}
                            />
                            <FieldDescription>Mã này được gửi khi học nút và khi bấm điều khiển.</FieldDescription>
                        </Field>

                        <Field>
                            <FieldLabel>Icon</FieldLabel>
                            <div className="grid grid-cols-6 gap-2">
                                {ICON_OPTIONS.map((item) => (
                                    <Button
                                        key={item.key}
                                        type="button"
                                        variant={iconKey === item.key ? "default" : "outline"}
                                        size="icon-lg"
                                        title={item.label}
                                        onClick={() => setIconKey(item.key)}
                                    >
                                        <HugeiconsIcon icon={item.icon} />
                                    </Button>
                                ))}
                            </div>
                        </Field>
                    </FieldGroup>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            <HugeiconsIcon icon={Cancel01Icon} data-icon="inline-start" />
                            Hủy
                        </Button>
                        <Button onClick={saveButton}>
                            <HugeiconsIcon icon={editingId ? SaveIcon : Add01Icon} data-icon="inline-start" />
                            {editingId ? "Lưu thay đổi" : "Thêm nút"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardContent>
    );
}
