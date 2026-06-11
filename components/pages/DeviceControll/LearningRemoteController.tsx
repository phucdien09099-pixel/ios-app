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
    const { send } = useTransport();

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
                        ? {
                            ...button,
                            name: trimmedName,
                            codeKey: normalizedCodeKey,
                            iconKey,
                            updatedAt: new Date().toISOString(),
                        }
                        : button
                );
            }

            return [
                ...current,
                {
                    id: crypto.randomUUID(),
                    name: trimmedName,
                    codeKey: normalizedCodeKey,
                    iconKey,
                    learned: false,
                    updatedAt: new Date().toISOString(),
                },
            ];
        });

        resetForm();
        setDialogOpen(false);
    };

    const deleteButton = (buttonId: string) => {
        setButtons((current) => current.filter((button) => button.id !== buttonId));
        if (editingId === buttonId) resetForm();
    };

    const learnButton = async (button: LearnedButton) => {
        setLearningId(button.id);
        try {
            await sendRemotePayload({
                command: "LEARN",
                key: button.codeKey,
                name: button.name,
            });

            setButtons((current) =>
                current.map((item) =>
                    item.id === button.id ? { ...item, learned: true, updatedAt: new Date().toISOString() } : item
                )
            );
            toast.success(`Đã gửi lệnh học nút ${button.name}`);
        } catch (error) {
            console.error(error);
            toast.error("Không thể gửi lệnh học nút");
        } finally {
            setLearningId(null);
        }
    };

    const runButton = async (button: LearnedButton) => {
        try {
            await sendRemotePayload({
                command: "SEND",
                key: button.codeKey,
                name: button.name,
            });
            toast.success(`Đã gửi nút ${button.name}`);
        } catch (error) {
            console.error(error);
            toast.error("Không thể gửi lệnh remote");
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

    return (
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
                        onClick={() => {
                            setLearnMode((value) => !value);
                            setEditMode(false);
                        }}
                    >
                        <HugeiconsIcon icon={AiLearningIcon} className={cn(learnMode && "animate-pulse")} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {buttons.map((button) => {
                    const iconOption = getIconOption(button.iconKey);
                    const isLearning = learningId === button.id;

                    return (
                        <div key={button.id} className="relative">
                            <Button
                                variant={button.learned ? "secondary" : "outline"}
                                className={cn(
                                    "h-28 w-full flex-col gap-3 rounded-lg",
                                    learnMode && "ring-2 ring-ring/30",
                                    isLearning && "animate-pulse"
                                )}
                                disabled={isLearning}
                                onClick={() => onRemoteButtonClick(button)}
                            >
                                <HugeiconsIcon icon={iconOption.icon} className="size-8" />
                                <span className="max-w-full truncate text-sm font-medium">{button.name}</span>
                            </Button>

                            {button.learned ? (
                                <div className="absolute top-2 left-2 flex size-5 items-center justify-center rounded-full bg-background ring-1 ring-border">
                                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3 text-muted-foreground" />
                                </div>
                            ) : null}

                            {editMode ? (
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <Button
                                        size="icon-xs"
                                        variant="outline"
                                        title="Sửa"
                                        aria-label="Sửa"
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
                                        aria-label="Xóa"
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
                                        aria-label={item.label}
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
