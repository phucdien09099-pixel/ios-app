"use client";

import { useState, useEffect } from "react";

import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";

import { Cancel01Icon, PlayIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";

import { HugeiconsIcon } from "@hugeicons/react";

import { Switch } from "@/components/ui/switch";

import { Device } from "@/db/types/devive";

import { Controller, useForm, UseFormReturn } from "react-hook-form";

import { TimerFormValues } from "./TimerDrawer";

import { Slider } from "@/components/ui/slider";

import ActionSelectionDrawer from "./ActionSelectionDrawer";



// Import các thành phần Drawer (Thường từ shadcn UI)

import {

    Drawer,

    DrawerContent,

    DrawerDescription,

    DrawerHeader,

    DrawerTitle,

} from "@/components/ui/drawer";

import { cn } from "@/libs/utils";



export type DeviceType = "LIGHT" | "AC" | "TV" | "SWITCH";

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";



// Định nghĩa bổ sung các Type thiếu để tránh lỗi Compile

export interface TimerAction {

    type: string;

    value: any;

    label: string;

}



export interface CreateTimerDrawerProps {

    form?: UseFormReturn<TimerFormValues>; // Chuyển thành optional nếu bạn tự khởi tạo useForm bên trong

    devices: Device[];

    onSelectDevice: (device: Device) => void;

    onCreateTimer: (finalData: any) => void;

    onCancel: () => void;

    getDeviceIcon: (type: DeviceType) => any;

    initialData?: any;

}



export const DAYS_OF_WEEK: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const DAYS_LABELS: Record<DayOfWeek, string> = {

    Monday: "T2", Tuesday: "T3", Wednesday: "T4", Thursday: "T5", Friday: "T6", Saturday: "T7", Sunday: "CN"

};



// Giữ nguyên mock data của bạn

const DEVICE_ACTIONS: Record<DeviceType, TimerAction[]> = {

    LIGHT: [

        { type: "power", value: "ON", label: "Bật đèn" },

        { type: "power", value: "OFF", label: "Tắt đèn" },

    ],

    AC: [

        { type: "power", value: "ON", label: "Bật máy lạnh" },

        { type: "power", value: "OFF", label: "Tắt máy lạnh" },

    ],

    TV: [

        { type: "power", value: "ON", label: "Bật TV" },

        { type: "power", value: "OFF", label: "Tắt TV" },

    ],

    SWITCH: [

        { type: "power", value: "ON", label: "Bật công tắc" },

        { type: "power", value: "OFF", label: "Tắt công tắc" },

    ],

};



/* =========================================================================

   1. GIAO DIỆN BÊN NGOÀI (GIỮ NGUYÊN 100% CỦA BẠN - KHÔNG SỬA GÌ)

   ========================================================================= */

export default function CreateTimerDrawer({

    devices,

    onSelectDevice,

    onCreateTimer,

    onCancel,

    getDeviceIcon,

    initialData,    

}: CreateTimerDrawerProps) {



    const form = useForm<TimerFormValues>({

        defaultValues: initialData ||{

            name: "",

            time: "",

            days: [],

            repeat: false,

            deviceId: "",

            action: undefined,

        } as any,

    });



    const { register, control, watch, setValue, handleSubmit } = form;



    const [showActionDrawer, setShowActionDrawer] = useState(false);

    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    useEffect(() => {

        if (initialData?.deviceId) {

            const dev = devices.find(d => d.id === initialData.deviceId);

            if (dev) setSelectedDevice(dev);

        }

    }, [initialData, devices]);

   



    const selectedDays = watch("days") || [];

    const deviceId = watch("deviceId");

    const action = watch("action") as TimerAction | undefined;



    // Hàm xử lý khi nhấn vào 1 thiết bị trong danh sách

    const handleDeviceClick = (device: Device) => {

        setValue("deviceId", device.id); // Cập nhật id thiết bị vào form

        setSelectedDevice(device);       // Lưu thiết bị đang chọn vào state

        setShowActionDrawer(true);       // Mở drawer chọn hành động lên

        if (typeof onSelectDevice === 'function') {

            onSelectDevice(device);

        }      

    };



    const handleSelectAction = (selectedAction: TimerAction) => {

        setValue("action", selectedAction as any); // Lưu hành động vào react-hook-form

        setShowActionDrawer(false);                // Đóng drawer chọn hành động

    };



    return (

        <div className="px-4 pb-40 space-y-4 max-h-[80vh] overflow-y-auto select-text">

            {/* Tên hẹn giờ */}

            <div>

                <div className="mb-2 text-sm font-medium">Tên hẹn giờ</div>

                <Input

                    placeholder="Ví dụ: Tắt TV"

                    {...register("name")}

                />

            </div>



            {/* Chọn thời gian */}

            <div>

                <div className="mb-2 text-sm font-medium">Chọn thời gian</div>

                <Input

                    type="time"

                    {...register("time")}

                />

            </div>



            {/* Chọn ngày */}

            <div>

                <div className="mb-2 text-sm font-medium">Chọn ngày</div>

                <div className="flex flex-wrap gap-2">

                    {DAYS_OF_WEEK.map((day) => {

                        const isSelected = selectedDays.includes(day);

                        return (

                            <Button

                                key={day}

                                type="button"

                                variant={isSelected ? "default" : "outline"}

                                size="sm"

                                className="rounded-xl"

                                onClick={() => {

                                    const newDays = isSelected

                                        ? selectedDays.filter((d) => d !== day)

                                        : [...selectedDays, day];

                                    setValue("days", newDays);

                                }}

                            >

                                {DAYS_LABELS[day]}

                            </Button>

                        );

                    })}

                </div>

            </div>



            {/* Chọn thiết bị */}

            <div>

                <div className="mb-2 text-sm font-medium">Chọn thiết bị</div>

                <div className="grid gap-2">

                    {devices.map((device) => {

                        const active = deviceId === device.id;

                        return (

                            <button

                                key={device.id}

                                type="button"

                                onClick={() => handleDeviceClick(device)}

                                className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${active ? "border-primary bg-primary/10" : "border-border"

                                    }`}

                            >

                                <div className="flex size-10 items-center justify-center rounded-xl bg-muted">

                                    <HugeiconsIcon icon={getDeviceIcon(device.type as DeviceType)} size={20} />

                                </div>

                                <div className="text-left flex-1">

                                    <div className="font-medium">{device.name}</div>

                                    <div className="text-xs text-muted-foreground">{device.type as DeviceType}</div>

                                </div>

                                {active && action?.label && (

                                    <Badge variant="secondary" className="ml-auto animate-in fade-in duration-200 truncate max-w-[120px]">

                                        {action.label}

                                    </Badge>

                                )}

                            </button>

                        );

                    })}

                </div>

            </div>



            {/* Lặp lại */}

            <div className="flex items-center justify-between rounded-2xl border p-3">

                <div>

                    <div className="font-medium">Lặp lại</div>

                    <div className="text-xs text-muted-foreground">Chạy mỗi ngày đã chọn</div>

                </div>

                <Controller

                    control={control}

                    name="repeat"

                    render={({ field }) => (

                        <Switch

                            checked={field.value}

                            onCheckedChange={field.onChange}

                        />

                    )}

                />

            </div>



            {/* Hệ thống nút bấm */}

            <div className="flex gap-2 pt-2">

                <Button

                    type="button"

                    variant="outline"

                    className="flex-1 gap-2 rounded-2xl"

                    onClick={onCancel}

                >

                    <HugeiconsIcon icon={Cancel01Icon} size={18} />

                    Hủy

                </Button>

                <Button

                    type="button"

                    className="flex-1 gap-2 rounded-2xl"

                    disabled={!deviceId}

                    onClick={handleSubmit(onCreateTimer)}

                >

                    <HugeiconsIcon icon={PlayIcon} size={18} />

                    Lưu timer

                </Button>

            </div>



            {/* Drawer chọn hành động */}

            <ActionSelectionDrawer

                open={showActionDrawer}

                onOpenChange={setShowActionDrawer}

                device={selectedDevice}

                currentAction={action}

                onSelectAction={handleSelectAction}

            />

        </div>

    );

}