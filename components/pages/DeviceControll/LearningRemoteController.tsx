"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { cn } from "@/libs/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, AiLearningIcon, ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, ArrowUp01Icon, BulbIcon, Cancel01Icon, CheckmarkCircle02Icon, Delete02Icon, Edit02Icon, Fan01Icon, Home01Icon, Menu01Icon, PauseIcon, PlayIcon, PowerIcon, RemoteControlIcon, SaveIcon, Settings02Icon, StopIcon, Tv01Icon, VolumeHighIcon, VolumeLowIcon, VolumeMute01Icon, } from "@hugeicons/core-free-icons";

import { Device } from "../Room/DeviceCard";
import { deviceRemoteButtonsRepository } from "@/db/repository/DeviceRemoteButtonsRepository";

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

const getDefaultButtons = (deviceId: string): LearnedButton[] =>
    DEFAULT_BUTTONS.map((button) => ({
        ...button,
        id: `${deviceId}:${button.id}`,
    }));

const normalizeCodeKey = (value: string) =>
    value
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toUpperCase();

const getIconOption = (key: RemoteIconKey) => ICON_OPTIONS.find((item) => item.key === key) ?? ICON_OPTIONS[0];

const dedupeButtons = (buttons: LearnedButton[]) => {
    const byCodeKey = new Map<string, LearnedButton>();

    for (const button of buttons) {
        byCodeKey.set(button.codeKey, button);
    }

    return Array.from(byCodeKey.values());
};

export default function LearningRemoteController({ data, roomName }: { data: Device; roomName: string }) {
    const [buttons, setButtons] = useState<LearnedButton[]>(() => getDefaultButtons(data.id));
    const [editMode, setEditMode] = useState(false);
    const [learnMode, setLearnMode] = useState(false);
    const [learningId, setLearningId] = useState<string | null>(null);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);
    const { send, lastMessage } = useTransport();
    const { open, back } = useNavDrawer();
    // 🔄 Tải cấu trúc nút từ SQLite cục bộ khi mở màn hình thiết bị
    useEffect(() => {
        const loadButtonsFromDB = async () => {
            try {
                const dbButtons = await deviceRemoteButtonsRepository.getByDeviceId(data.id);
                console.log(dbButtons)
                if (dbButtons && dbButtons.length > 0) {
                    // Ánh xạ dữ liệu từ cấu trúc DB (snake_case/Integer) về State của FE (camelCase/Boolean)
                    const formatted = dbButtons.map((btn: any) => ({
                        id: btn.id,
                        name: btn.name,
                        codeKey: btn.code_key,
                        iconKey: btn.icon_key,
                        learned: btn.learned === 1,
                        dataBase64: btn.data_base64,
                        updatedAt: btn.updated_at,
                    }));
                    const deduped = dedupeButtons(formatted);
                    setButtons(deduped);

                    if (deduped.length !== formatted.length) {
                        await deviceRemoteButtonsRepository.upsertMany(data.id, deduped);
                    }
                } else {
                    setButtons(getDefaultButtons(data.id));
                }
            } catch (error) {
                console.error("❌ [Tauri DB] Lỗi đọc cấu trúc nút từ SQLite:", error);
                setButtons(getDefaultButtons(data.id));
            }
        };

        loadButtonsFromDB();
    }, [data.id]);

    // 💾 Hàm thực thi ghi đè/cập nhật mảng trạng thái nút trực tiếp xuống SQLite cục bộ
    const syncButtonsToDB = async (latestButtons: LearnedButton[]) => {
        try {
            await deviceRemoteButtonsRepository.upsertMany(data.id, latestButtons);
            console.log("💾 [Tauri DB] Đồng bộ trực tiếp dữ liệu vào SQLite thành công.");
        } catch (error) {
            console.error("❌ [Tauri DB] Lỗi đồng bộ dữ liệu xuống SQLite:", error);
            toast.error("Không thể lưu trạng thái nút bấm vào DB nội bộ!");
        }
    };

    // 🔄 Vòng lặp Effect xử lý dữ liệu thời gian thực từ Socket gửi về
    useEffect(() => {
        if (!lastMessage) return;

        try {
            let messagePayload: any = null;
            if (typeof lastMessage.payload === "string") {
                messagePayload = JSON.parse(lastMessage.payload);
            } else if (lastMessage.payload && typeof lastMessage.payload === "object") {
                messagePayload = lastMessage.payload;
            }

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
                    const currentLearningId = learningId;

                    setButtons((current) => {
                        const updated = current.map((item) =>
                            item.id === currentLearningId
                                ? {
                                    ...item,
                                    learned: true,
                                    dataBase64: incomingBase64,
                                    updatedAt: new Date().toISOString(),
                                }
                                : item
                        );

                        // 💾 Lưu trực tiếp chuỗi base64 vừa nhận vào SQLite
                        syncButtonsToDB(updated);
                        return updated;
                    });

                    toast.success(`🎉 Đã học thành công!`);

                    setSuccessId(currentLearningId);
                    setLearningId(null);

                    setTimeout(() => {
                        setSuccessId((prev) => (prev === currentLearningId ? null : prev));
                    }, 2000);
                } else {
                    console.warn("⚠️ [LearningRemote] Đúng type SEND_LEARNING nhưng trường 'action.dataBase64' trống.");
                }
            }

            // TRƯỜNG HỢP 2: Lắng nghe phản hồi lệnh phát sóng thành công từ ESP32
            if (messagePayload?.type === "REMOTE_ACK" || messagePayload?.type === "SEND_SUCCESS") {
                console.log("🚀 [LearningRemote] Mạch xác nhận đã phát xung IR hoàn tất.");
                setSendingId(null);
            }

        } catch (error) {
            console.error("[LearningRemote] Lỗi nghiêm trọng khi bóc tách gói tin IR:", error);
        }
    }, [lastMessage, learnMode, learningId]);

    const openButtonDrawer = (button?: LearnedButton) => {
        open({
            id: button ? `edit-remote-button-${button.id}` : `create-remote-button-${data.id}`,
            title: button ? "Sửa nút remote" : "Thêm nút remote",
            direction: "bottom",
            className: "mt-[8vh]! w-screen bg-background rounded-t-2xl",
            component: RemoteButtonBottomDrawer,
            props: {
                initialName: button?.name ?? "",
                initialCodeKey: button?.codeKey ?? "",
                initialIconKey: button?.iconKey ?? "remote",
                onSubmit: (values: { name: string; codeKey: string; iconKey: RemoteIconKey }) => {
                    const saved = saveButton({
                        editingId: button?.id,
                        ...values,
                    });

                    if (saved) back();
                    return saved;
                },
            },
        });
    };

    const openCreateDialog = () => {
        openButtonDrawer();
    };

    const openEditDialog = (button: LearnedButton) => {
        openButtonDrawer(button);
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

    const saveButton = ({
        editingId,
        name,
        codeKey,
        iconKey,
    }: {
        editingId?: string;
        name: string;
        codeKey: string;
        iconKey: RemoteIconKey;
    }) => {
        const trimmedName = name.trim();
        const normalizedCodeKey = normalizeCodeKey(codeKey || name);
        const duplicateButton = buttons.find(
            (button) => button.codeKey === normalizedCodeKey && button.id !== editingId
        );

        if (!trimmedName || !normalizedCodeKey) {
            toast.error("Vui lòng nhập tên nút");
            return false;
        }

        if (duplicateButton) {
            toast.error(`Mã nút ${normalizedCodeKey} đã tồn tại`);
            return false;
        }

        setButtons((current) => {
            let updated;
            if (editingId) {
                updated = current.map((button) =>
                    button.id === editingId
                        ? { ...button, name: trimmedName, codeKey: normalizedCodeKey, iconKey, updatedAt: new Date().toISOString() }
                        : button
                );
            } else {
                updated = [
                    ...current,
                    { id: crypto.randomUUID(), name: trimmedName, codeKey: normalizedCodeKey, iconKey, learned: false, updatedAt: new Date().toISOString() },
                ];
            }

            // 💾 Lưu cấu trúc nút mới tạo hoặc vừa sửa vào SQLite
            syncButtonsToDB(updated);
            return updated;
        });

        return true;
    };

    const deleteButton = (buttonId: string) => {
        setButtons((current) => {
            const updated = current.filter((button) => button.id !== buttonId);

            // 💾 Xóa bản ghi trong SQLite (hoặc cập nhật lại mảng đã lọc)
            syncButtonsToDB(updated);
            return updated;
        });
    };

    const learnButton = async (button: LearnedButton) => {
        setLearningId(button.id);
        try {
            await sendRemotePayload({
                command: "LEARN",
                key: button.codeKey,
                name: button.name,
            });
            toast.info(`Chế độ học: Hãy ấn nút trên Remote thật hướng vào mắt thu...`);
        } catch (error) {
            console.error(error);
            toast.error("Không thể gửi lệnh học nút");
            setLearningId(null);
        }
    };

    const runButton = async (button: LearnedButton) => {
        if (!button.learned || !button.dataBase64) {
            toast.error(`Nút ${button.name} chưa được học lệnh hồng ngoại!`);
            return;
        }

        // console.log(button)

        setSendingId(button.id);
        try {
            await sendRemotePayload({
                command: "SEND",
                key: button.codeKey,
                name: button.name,
                dataBase64: button.dataBase64,
            });
            toast.success(`Đã phát lệnh nút ${button.name}`);

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
            console.error("Lỗi thay đổi trạng thái học lệnh tổng thể:", error);
            toast.error("Không thể đồng bộ chế độ học lệnh với thiết bị");
            setLearnMode(learnMode);
        }
    };

    return (
        <>
            <CardContent className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                        <h1 className="truncate text-xl font-semibold">{data.name}</h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={learnMode ? "default" : "outline"}>Learning mode</Badge>
                            <Badge variant={editMode ? "default" : "outline"}>{buttons.length} buttons</Badge>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        <Button
                            size="icon-lg"
                            variant="outline"
                            title="Thêm nút"
                            aria-label="Thêm nút"
                            onClick={openCreateDialog}
                        >
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

                <div className="grid grid-cols-2 gap-3">
                    {buttons.map((button) => {
                        const iconOption = getIconOption(button.iconKey);
                        const isLearning = learningId === button.id;
                        const isSending = sendingId === button.id;
                        const isSuccess = successId === button.id;

                        return (
                            <div key={button.id} className="relative">
                                <Button
                                    variant={button.learned ? "secondary" : "outline"}
                                    className={cn(
                                        "h-28 w-full flex-col gap-3 rounded-lg transition-all duration-300",
                                        learnMode && "ring-2 ring-orange-500/30",
                                        isLearning && "animate-pulse ring-2 ring-destructive bg-destructive/10 text-destructive",
                                        isSending && "animate-pulse ring-2 ring-primary bg-primary/10 text-primary scale-95",
                                        isSuccess && "ring-4 ring-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold scale-105"
                                    )}
                                    disabled={isLearning}
                                    onClick={() => onRemoteButtonClick(button)}
                                >
                                    <HugeiconsIcon
                                        icon={isSuccess ? CheckmarkCircle02Icon : iconOption.icon}
                                        className={cn("size-8 transition-transform", isSuccess && "animate-bounce text-emerald-500", isSending && "scale-110 text-primary")}
                                    />
                                    <span className="max-w-full truncate text-sm font-medium">
                                        {isSuccess ? "ĐÃ NHẬN!" : button.name}
                                    </span>
                                </Button>

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
            </CardContent>
           
        </>
    );
}

function RemoteButtonBottomDrawer({
    initialName,
    initialCodeKey,
    initialIconKey,
    onSubmit,
}: {
    initialName: string;
    initialCodeKey: string;
    initialIconKey: RemoteIconKey;
    onSubmit: (values: { name: string; codeKey: string; iconKey: RemoteIconKey }) => boolean;
}) {
    const { back } = useNavDrawer();
    const [name, setName] = useState(initialName);
    const [codeKey, setCodeKey] = useState(initialCodeKey);
    const [iconKey, setIconKey] = useState<RemoteIconKey>(initialIconKey);
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);

    const handleSubmit = () => {
        if (savingRef.current) return;

        savingRef.current = true;
        setSaving(true);
        const saved = onSubmit({ name, codeKey, iconKey });

        if (!saved) {
            savingRef.current = false;
            setSaving(false);
        }
    };

    return (
        <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto px-4 pb-8 select-text">
            <FieldGroup>
                <Field className="z-999">
                    <FieldLabel htmlFor="remote-button-name">Tên nút</FieldLabel>
                    <Input
                        id="remote-button-name"
                        placeholder="Ví dụ: Power, Fan, HDMI"
                        value={name}
                        autoFocus
                        onChange={(event) => {
                            setName(event.target.value);
                            if (!initialCodeKey) setCodeKey(normalizeCodeKey(event.target.value));
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

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={back}>
                    <HugeiconsIcon icon={Cancel01Icon} data-icon="inline-start" />
                    Hủy
                </Button>
                <Button disabled={saving} onClick={handleSubmit}>
                    <HugeiconsIcon icon={SaveIcon} data-icon="inline-start" />
                    Lưu
                </Button>
            </div>
        </div>
    );
}
