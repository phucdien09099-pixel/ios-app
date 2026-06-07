"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/utils";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Add01Icon,
    AiLearningIcon,
    Cancel01Icon,
    CheckmarkCircle02Icon,
    Delete02Icon,
    Edit02Icon,
    PlayIcon,
    RemoteControlIcon,
    SaveIcon,
} from "@hugeicons/core-free-icons";
import { Device } from "../Room/DeviceCard";

type LearnedButton = {
    id: string;
    name: string;
    codeKey: string;
    learned: boolean;
    updatedAt: string;
};

const DEFAULT_BUTTONS: LearnedButton[] = [
    { id: "power", name: "Power", codeKey: "POWER", learned: false, updatedAt: "" },
    { id: "mode", name: "Mode", codeKey: "MODE", learned: false, updatedAt: "" },
    { id: "up", name: "Up", codeKey: "UP", learned: false, updatedAt: "" },
    { id: "down", name: "Down", codeKey: "DOWN", learned: false, updatedAt: "" },
];

const normalizeCodeKey = (value: string) =>
    value
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toUpperCase();

export default function LearningRemoteController({ data, roomName }: { data: Device; roomName: string }) {
    const storageKey = useMemo(() => `learning-remote:${data.id}:buttons`, [data.id]);
    const [buttons, setButtons] = useState<LearnedButton[]>(DEFAULT_BUTTONS);
    const [name, setName] = useState("");
    const [codeKey, setCodeKey] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [learningId, setLearningId] = useState<string | null>(null);
    const { send } = useTransport();

    useEffect(() => {
        const saved = window.localStorage.getItem(storageKey);
        if (!saved) return;

        try {
            const parsed = JSON.parse(saved) as LearnedButton[];
            if (Array.isArray(parsed)) {
                setButtons(parsed);
            }
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
        setEditingId(null);
    };

    const sendRemotePayload = async (action: Record<string, any>) => {
        const payload = {
            type: "LEARNING_REMOTE",
            ir_devices: data.name,
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
                        ? { ...button, name: trimmedName, codeKey: normalizedCodeKey, updatedAt: new Date().toISOString() }
                        : button
                );
            }

            return [
                ...current,
                {
                    id: crypto.randomUUID(),
                    name: trimmedName,
                    codeKey: normalizedCodeKey,
                    learned: false,
                    updatedAt: new Date().toISOString(),
                },
            ];
        });

        resetForm();
    };

    const editButton = (button: LearnedButton) => {
        setEditingId(button.id);
        setName(button.name);
        setCodeKey(button.codeKey);
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

    return (
        <CardContent className="flex flex-col gap-5 p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                    <h1 className="truncate text-xl font-semibold">{data.name}</h1>
                    <p className="text-sm text-muted-foreground">Remote học lệnh IR/RF</p>
                </div>

                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted">
                    <HugeiconsIcon icon={RemoteControlIcon} />
                </div>
            </div>

            <Card size="sm">
                <CardHeader>
                    <CardTitle>{editingId ? "Sửa nút remote" : "Thêm nút remote"}</CardTitle>
                    <CardDescription>Mỗi nút có một mã riêng để học và gửi lại tín hiệu.</CardDescription>
                    <CardAction>
                        {editingId ? (
                            <Button size="icon-sm" variant="ghost" onClick={resetForm}>
                                <HugeiconsIcon icon={Cancel01Icon} />
                            </Button>
                        ) : null}
                    </CardAction>
                </CardHeader>

                <CardContent>
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
                            <FieldDescription>Mã này được gửi xuống bộ điều khiển khi học và khi bấm.</FieldDescription>
                        </Field>

                        <Button onClick={saveButton} className="w-full">
                            <HugeiconsIcon icon={editingId ? SaveIcon : Add01Icon} data-icon="inline-start" />
                            {editingId ? "Lưu thay đổi" : "Thêm nút"}
                        </Button>
                    </FieldGroup>
                </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
                {buttons.map((button) => (
                    <Card key={button.id} size="sm" className="overflow-visible">
                        <CardHeader>
                            <CardTitle className="flex min-w-0 items-center gap-2">
                                <span className="truncate">{button.name}</span>
                                <Badge variant={button.learned ? "secondary" : "outline"}>
                                    {button.learned ? "Đã học" : "Chưa học"}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="truncate">{button.codeKey}</CardDescription>
                        </CardHeader>

                        <CardContent className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    disabled={learningId === button.id}
                                    onClick={() => learnButton(button)}
                                >
                                    <HugeiconsIcon
                                        icon={button.learned ? CheckmarkCircle02Icon : AiLearningIcon}
                                        data-icon="inline-start"
                                        className={cn(learningId === button.id && "animate-pulse")}
                                    />
                                    Học nút
                                </Button>

                                <Button onClick={() => runButton(button)} disabled={!button.learned}>
                                    <HugeiconsIcon icon={PlayIcon} data-icon="inline-start" />
                                    Bấm
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="ghost" onClick={() => editButton(button)}>
                                    <HugeiconsIcon icon={Edit02Icon} data-icon="inline-start" />
                                    Sửa
                                </Button>

                                <Button variant="destructive" onClick={() => deleteButton(button.id)}>
                                    <HugeiconsIcon icon={Delete02Icon} data-icon="inline-start" />
                                    Xóa
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </CardContent>
    );
}
