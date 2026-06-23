"use client"
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import DeviceControll from "../DeviceControll";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Setting06Icon } from "@hugeicons/core-free-icons";
import HubSettings from "../HubSettings";
import { SettingSwitchController } from "../DeviceControll/SmartSwitchController";
import { deviceRepo } from "@/db/repository/DeviceRepository";
import { toast } from "sonner";
import { startACTour, startTVTour } from "@/components/onboarding/tours/devicecontrolTour";
import HelpButton from "@/components/common/HelpButton";
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "@/components/ui/alert-dialog";

export type Device = {
    id: string;
    name: string;
    serial: string;
    type: "AC" | "TV" | "FAN" | "LIGHT" | "RELAY" | "SMART_SCHEDULE" | "LEARNING_REMOTE";
    brand: "DAIKIN" | "SAMSUNG" | "LG" | "XIAOMI";
    status: "ONLINE" | "OFFLINE" | "ERROR";
};

const statusStyle = {
    ONLINE: "bg-green-500",
    OFFLINE: "bg-gray-400",
    ERROR: "bg-red-500",
};

export default function DeviceCard({ roomName, device, onDeleted }: { roomName: string, device: Device, onDeleted: () => Promise<void> }) {
    const { open } = useNavDrawer();
    const [openDelete, setOpenDelete] = useState(false);

    const hanldeDeleteDevice = async (deviceId: any) => {
        try {
            await deviceRepo.deleteDevice(deviceId);
            toast.success("Deleted device");
            await onDeleted();
        } catch (error) {
            toast.success("Deleted Fail");
        }
    }
    return (
    <Card data-tour={`device-card-${device.id}`} className="hover:shadow-lg transition cursor-pointer">
        <CardHeader className="space-y-1 relative">
            <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                    {device.name}
                </CardTitle>

                <span
                    className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        statusStyle[device.status]
                    )}
                />
            </div>

            <p className="text-xs text-muted-foreground">
                {device.type} • {device.brand}
            </p>
            
            <Button
                data-tour="device-delete-btn"
                variant="ghost"
                size="icon"
                className="absolute z-10 right-2 bottom-8 text-red-500 hover:text-red-600"
                onClick={(e) => {
                    e.stopPropagation(); // Ngăn mở Card khi bấm nút xoá
                    setOpenDelete(true);
                }}
            >
                <HugeiconsIcon icon={Delete02Icon} />
            </Button>

            <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
                <AlertDialogContent className="z-[9999] pointer-events-auto w-[280px] rounded-[24px] bg-white p-5 shadow-xl border-none gap-0">
                    {/* Phần chữ trung tâm */}
                    <div className="flex flex-col items-center text-center mt-1 mb-5 gap-1.5">
                        <AlertDialogTitle className="text-[17px] font-semibold text-gray-900">
                            Xoá thiết bị
                        </AlertDialogTitle>
                        <p className="text-[13px] text-gray-500 leading-relaxed px-2">
                            Thiết bị sẽ bị xoá khỏi phòng. <br />
                            Bạn có chắc chắn muốn xoá?
                        </p>
                    </div>
                    
                    {/* Hai nút chức năng bo góc tròn */}
                    <div className="flex justify-center gap-3 w-full">
                        <Button 
                            variant="secondary" 
                            className="flex-1 rounded-full h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm" 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setOpenDelete(false); 
                            }}
                        >
                            Huỷ
                        </Button>
                        <Button 
                            variant="destructive" 
                            className="flex-1 rounded-full h-10 bg-[#f43f5e] hover:bg-[#e11d48] text-white font-medium text-sm shadow-none" 
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenDelete(false);
                                hanldeDeleteDevice(device.id); 
                            }}
                        >
                            Xoá
                        </Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </CardHeader>

        <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
                <Badge
                    variant={
                        device.status === "ONLINE"
                            ? "default"
                            : device.status === "ERROR"
                                ? "destructive"
                                : "secondary"
                    }
                >
                    {device.status}
                </Badge>

                <span className="text-xs text-muted-foreground">
                    ID: {device.id.slice(0, 6)}
                </span>
            </div>

            <div className="flex gap-2 pt-2">
                <Button 
                    data-tour="device-control-btn"
                    size="sm"
                    className="flex-1"
                    onClick={() => open({
                        id: device.id,
                        title: device.name,
                        component: DeviceControll,
                        props: {
                            device,
                            roomName
                        },
                        // Bọc tất cả vào 1 div flex để hiển thị nhiều nút cùng lúc ở header panel mới mở
                        renderRightButtonHeader: (
                            <div className="flex items-center gap-1">
                                {/* 1. Nút Setting dành riêng cho RELAY */}
                                {device.type === "RELAY" && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            open({
                                                id: device.id + device.name + "setting",
                                                title: device.name + " setting",
                                                component: SettingSwitchController,
                                            });
                                        }}
                                    >
                                        <HugeiconsIcon icon={Setting06Icon} />
                                    </Button>
                                )}

                                {/* 2. Nút ? dành cho Tivi */}
                                {device.type === "TV" && (
                                    <HelpButton onClick={() => startTVTour(true)} />
                                )}

                                {/* 3. Nút ? dành cho Điều hòa (hoặc thiết bị mặc định chưa có type) */}
                                {(device.type === "AC" || !["TV", "RELAY", "LIGHT", "SMART_SCHEDULE", "LEARNING_REMOTE"].includes(device.type)) && (
                                    <HelpButton onClick={() => startACTour(true)} />
                                )}
                            </div>
                        )
                    })} 
                >
                    Control
                </Button>

                <Button size="sm" variant="outline">
                    Detail
                </Button>
            </div>
        </CardContent>
    </Card>
);
}
