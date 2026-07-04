"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { HugeiconsIcon } from "@hugeicons/react";
import { startAutomationTour } from "@/components/onboarding/tours/automationTour";
import {
    Cancel01Icon,
    Clock01Icon,
    Moon02Icon,
    PlayIcon,
    Settings02Icon,
    SleepingIcon,
    Sun03Icon,
    TemperatureIcon,
    ThermometerIcon,
} from "@hugeicons/core-free-icons";
import { Device } from "@/db/types/devive";
import { useForm } from "react-hook-form";
import ActionSelectionDrawer from "./ActionSelectionDrawer";
import { TimerAction } from "./CreateTimer";
import { cn } from "@/libs/utils";
import { useTransport } from "@/components/providers/transport/TransportProvider";

export type DeviceType = "LIGHT" | "AC" | "TV" | "SWITCH";
export type AutomationMode = "sleep" | "custom";

export interface AutomationFormValues {
    name: string;
    automationMode: AutomationMode;
    sleepTime: string;
    wakeTime: string;
    currentTemperature: string;
    comfortTemperature: string;
    operator: string;
    conditionValue: string;
    action: TimerAction | undefined;
    deviceId: any;    // 💾 Vẫn giữ nguyên để lưu Database
    deviceName: string; // 🏷️ Thêm vào để lấy dữ liệu đồng bộ ra ngoài phần cứng/giao diện
}

export interface CreateAutomationDrawerProps {
    roomName?: string;
    devices: Device[];
    onCreateAutomation: (finalData: any) => void;
    onCancel: () => void;
    initialData?: Partial<AutomationFormValues>;
    getDeviceIcon: (type: string) => any;
}

const DEFAULT_VALUES: AutomationFormValues = {
    name: "",
    automationMode: "sleep",
    sleepTime: "22:30",
    wakeTime: "06:30",
    currentTemperature: "28",
    comfortTemperature: "26",
    operator: ">",
    conditionValue: "28",
    action: undefined,
    deviceId: "",
    deviceName: "",
};

export default function CreateAutomation({
    roomName,
    devices = [],
    onCreateAutomation,
    onCancel,
    initialData,
    getDeviceIcon,
}: CreateAutomationDrawerProps) {
    const form = useForm<AutomationFormValues>({
        defaultValues: {
            ...DEFAULT_VALUES,
            ...initialData,
            automationMode: initialData?.automationMode || DEFAULT_VALUES.automationMode,
        },
    });
    const { register, watch, setValue, handleSubmit } = form;
    const { deviceStates } = useTransport();
    const currentRoomState = roomName ? deviceStates[roomName] : undefined;
    const currentTemp = typeof currentRoomState?.temp === "number"
        ? String(currentRoomState.temp)
        : watch("currentTemperature") || DEFAULT_VALUES.currentTemperature;

    const [showActionDrawer, setShowActionDrawer] = useState(false);
    const [selectedActionDevice, setSelectedActionDevice] = useState<Device | null>(null);

    const automationMode = watch("automationMode");
    const watchActionDeviceId = watch("deviceId"); // 🔍 Vẫn theo dõi DeviceId để xử lý logic canSubmit
    const watchAction = watch("action");
    const watchConditionValue = watch("conditionValue");
    const comfortTemperature = watch("comfortTemperature") || "26";

    useEffect(() => {
        if (sessionStorage.getItem("automation_tour_active") === "true") {
            const delayTimer = setTimeout(() => startAutomationTour(true), 400);
            return () => clearTimeout(delayTimer);
        }
    }, []);
    useEffect(() => {
        if (!initialData?.deviceId) return;

        const device = devices.find((item) => item.id === initialData.deviceId);
        if (device) setSelectedActionDevice(device);
    }, [initialData, devices]);

    const handleDecrement = (field: "conditionValue" | "currentTemperature" | "comfortTemperature") => {
        const current = parseInt(watch(field), 10) || 0;
        setValue(field, String(current - 1));
    };

    const handleIncrement = (field: "conditionValue" | "currentTemperature" | "comfortTemperature") => {
        const current = parseInt(watch(field), 10) || 0;
        setValue(field, String(current + 1));
    };

    const handleActionDeviceClick = (device: Device) => {
        // ✨ Lưu song song cả ID và Name vào biểu mẫu Form State
        setValue("deviceId", device.id);
        setValue("deviceName", device.name || "");

        setSelectedActionDevice(device);
        setShowActionDrawer(true);
    };

    const handleSelectAction = (selectedAction: TimerAction) => {
        setValue("action", selectedAction);
        setShowActionDrawer(false);
    };

    const canSubmit =
        automationMode === "sleep"
            ? Boolean(watch("sleepTime") && watch("wakeTime") && watchActionDeviceId && watchAction)
            : Boolean(watch("operator") && watchConditionValue && watchActionDeviceId && watchAction);

    return (
        <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto px-4 pb-40 select-text">
            <FieldGroup data-tour="scene-name">
                <Field>
                    <FieldLabel htmlFor="automation-name">Tên tự động hóa</FieldLabel>
                    <Input
                        id="automation-name"
                        placeholder="Ví dụ: Chế độ ngủ ngon"
                        {...register("name")}
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="automation-mode">Chức năng</FieldLabel>
                    <NativeSelect id="automation-mode" className="w-full" {...register("automationMode")}>
                        <NativeSelectOption value="sleep">Chế độ ngủ ngon</NativeSelectOption>
                        <NativeSelectOption value="custom">Tùy chỉnh</NativeSelectOption>
                    </NativeSelect>
                </Field>
            </FieldGroup>

            {automationMode === "sleep" ? (
                <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4" data-tour="scene-condition">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                            <HugeiconsIcon icon={SleepingIcon} />
                        </div>
                        <div>
                            <div className="font-semibold">Chế độ ngủ ngon</div>
                            <div className="text-xs text-muted-foreground">
                                Thiết lập thời gian ngủ, thức dậy và mức nhiệt dễ chịu.
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field>
                            <FieldLabel htmlFor="sleep-time">Giờ ngủ</FieldLabel>
                            <div className="relative">
                                <HugeiconsIcon
                                    icon={Moon02Icon}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <Input id="sleep-time" type="time" className="pl-9" {...register("sleepTime")} />
                            </div>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="wake-time">Giờ thức</FieldLabel>
                            <div className="relative">
                                <HugeiconsIcon
                                    icon={Sun03Icon}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <Input id="wake-time" type="time" className="pl-9" {...register("wakeTime")} />
                            </div>
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <TemperatureStepper
                            label="Nhiệt độ hiện tại"
                            value={currentTemp}
                            onMinus={() => handleDecrement("currentTemperature")}
                            onPlus={() => handleIncrement("currentTemperature")}
                            icon={TemperatureIcon}
                            readOnly
                        />
                        <TemperatureStepper
                            label="Nhiệt độ thoải mái"
                            value={comfortTemperature}
                            inputProps={register("comfortTemperature")}
                            onMinus={() => handleDecrement("comfortTemperature")}
                            onPlus={() => handleIncrement("comfortTemperature")}
                            icon={ThermometerIcon}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4" data-tour="scene-condition">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                            <HugeiconsIcon icon={Settings02Icon} />
                        </div>
                        <div>
                            <div className="font-semibold">Tùy chỉnh</div>
                            <div className="text-xs text-muted-foreground">
                                Tự đặt điều kiện nhiệt độ để kích hoạt hành động.
                            </div>
                        </div>
                    </div>

                    <Field>
                        <FieldLabel htmlFor="temperature-operator">Điều kiện</FieldLabel>
                        <NativeSelect id="temperature-operator" className="w-full" {...register("operator")}>
                            <NativeSelectOption value=">">Nhiệt độ trên</NativeSelectOption>
                            <NativeSelectOption value="<">Nhiệt độ dưới</NativeSelectOption>
                        </NativeSelect>
                    </Field>

                    <TemperatureStepper
                        label={watch("operator") === "<" ? "Nhiệt độ dưới" : "Nhiệt độ trên"}
                        description="Kích hoạt khi đạt mức nhiệt này"
                        value={watchConditionValue}
                        inputProps={register("conditionValue")}
                        onMinus={() => handleDecrement("conditionValue")}
                        onPlus={() => handleIncrement("conditionValue")}
                        icon={TemperatureIcon}
                    />
                </div>
            )}

            <div className="flex flex-col gap-2" data-tour="scene-action">
                <div className="text-sm font-medium">Chọn thiết bị và hành động</div>
                <div className="grid gap-2">
                    {devices.map((device) => {
                        // 🟢 UI nút bấm bên ngoài giao diện vẫn kích hoạt Active mượt mà dựa trên deviceId
                        const isActive = watchActionDeviceId === device.id;

                        return (
                            <button
                                key={device.id}
                                type="button"
                                onClick={() => handleActionDeviceClick(device)}
                                className={cn(
                                    "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                                    isActive ? "border-primary bg-primary/10" : "border-border"
                                )}
                            >
                                <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                                    <HugeiconsIcon icon={getDeviceIcon(device.type || "")} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium">{device.name}</div>
                                    <div className="text-xs text-muted-foreground">{device.type}</div>
                                </div>
                                {isActive && watchAction?.label ? (
                                    <Badge variant="secondary" className="max-w-32 truncate">
                                        {watchAction.label}
                                    </Badge>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={onCancel}>
                    <HugeiconsIcon icon={Cancel01Icon} data-icon="inline-start" />
                    Hủy
                </Button>
                <div data-tour="scene-save" className="flex-1">
                    <Button
                        type="button"
                        className="w-full rounded-2xl"
                        disabled={!canSubmit}
                        onClick={(e) => {
                            sessionStorage.removeItem("automation_tour_active");
                            import('@/components/onboarding/tours/automationTour').then(m => {
                                if (m.automationDriverObj) m.automationDriverObj.destroy();
                            });

                            handleSubmit(onCreateAutomation)(e);
                        }}
                    >
                        <HugeiconsIcon icon={PlayIcon} data-icon="inline-start" />
                        Lưu kịch bản
                    </Button>
                </div>
            </div>

            <ActionSelectionDrawer
                open={showActionDrawer}
                onOpenChange={setShowActionDrawer}
                device={selectedActionDevice}
                currentAction={watchAction}
                onSelectAction={handleSelectAction}
            />
        </div>
    );
}

function TemperatureStepper({
    label,
    description,
    value,
    inputProps,
    onMinus,
    onPlus,
    icon,
    readOnly = false,
}: {
    label: string;
    description?: string;
    value: string;
    inputProps?: any;
    onMinus: () => void;
    onPlus: () => void;
    icon: any;
    readOnly?: boolean;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background p-3">
            <div className="flex items-start gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <HugeiconsIcon icon={icon} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{label}</div>
                    {description ? <FieldDescription>{description}</FieldDescription> : null}
                </div>
            </div>

            <div className="flex h-full! items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 p-1">
                {!readOnly && (
                    <button
                        type="button"
                        onClick={onMinus}
                        className="flex size-8 items-center justify-center rounded-lg text-lg font-semibold transition-colors hover:bg-background active:scale-95"
                    >
                        -
                    </button>
                )}
                <div className="flex min-w-0 flex-1 items-center justify-center">
                    <input
                        type="number"
                        className={cn(
                            "w-10 bg-transparent text-center text-sm font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                            readOnly && "pointer-events-none"
                        )}
                        {...inputProps}
                        value={value || ""}
                        readOnly={readOnly}
                        onChange={readOnly ? undefined : inputProps?.onChange}
                        tabIndex={readOnly ? -1 : undefined}
                    />
                    <span className="text-sm font-bold">°C</span>
                </div>
                {!readOnly && (
                    <button
                        type="button"
                        onClick={onPlus}
                        className="flex size-8 items-center justify-center rounded-lg text-lg font-semibold transition-colors hover:bg-background active:scale-95"
                    >
                        +
                    </button>
                )}
            </div>
        </div>
    );
}
