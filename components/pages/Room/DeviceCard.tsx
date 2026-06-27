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
import { useTransport } from "@/components/providers/transport/TransportProvider";

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
    const { getDeviceStatus } = useTransport();
    const [openDelete, setOpenDelete] = useState(false);
    const isLiveOnline =
        getDeviceStatus(device.id) ||
        getDeviceStatus(device.name) ||
        Boolean(device.serial && getDeviceStatus(device.serial)) ||
        getDeviceStatus(roomName);
    const displayStatus: Device["status"] = isLiveOnline ? "ONLINE" : device.status;

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
    <Card data-tour={`device-card-${device.id}`} className="group overflow-hidden rounded-3xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="relative gap-3 pb-3">
            <div className="flex items-center justify-between">
                <CardTitle className="truncate text-lg">
                    {device.name}
                </CardTitle>

                <span
                    className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        statusStyle[displayStatus]
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
                className="absolute z-10 right-2 bottom-2 size-9 rounded-2xl text-muted-foreground opacity-70 transition-opacity hover:text-red-600 group-hover:opacity-100"
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

        <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <Badge
                    variant={
                        displayStatus === "ONLINE"
                            ? "default"
                            : displayStatus === "ERROR"
                                ? "destructive"
                                : "secondary"
                    }
                    className="rounded-full px-2.5 py-1"
                >
                    {displayStatus}
                </Badge>

                <span className="text-xs text-muted-foreground">
                    ID: {device.id.slice(0, 6)}
                </span>
            </div>

            <div className="rounded-2xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Trạng thái</p>
                <p className="text-sm font-semibold">
                    {displayStatus === "ONLINE" ? "Sẵn sàng điều khiển" : displayStatus === "ERROR" ? "Cần kiểm tra" : "Chưa có phản hồi"}
                </p>
            </div>

            <div className="flex gap-2 pt-1">
                <Button 
                    data-tour="device-control-btn"
                    size="lg"
                    className="h-11 flex-1 rounded-2xl"
                    onClick={() => open({
                        id: device.id,
                        title: device.name,
                        component: DeviceControll,
                        props: {
                            device,
                            roomName
                        },
                        renderHelpButtonHeader: device.type === "TV"
                            ? <HelpButton onClick={() => startTVTour(true)} />
                            : (device.type === "AC" || !["TV", "RELAY", "LIGHT", "SMART_SCHEDULE", "LEARNING_REMOTE"].includes(device.type))
                                ? <HelpButton onClick={() => startACTour(true)} />
                                : undefined,
                        renderRightButtonHeader: device.type === "RELAY" ? (
                            <Button
                                size="lg"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    open({
                                        id: device.id + device.name + "setting",
                                        title: device.name + " setting",
                                        component: SettingSwitchController,
                                    });
                                }}
                            >
                                <HugeiconsIcon data-icon="inline-start" icon={Setting06Icon} />
                                Cài đặt thiết bị
                            </Button>
                        ) : undefined
                    })} 
                >
                    Điều khiển
                </Button>

                <Button size="lg" variant="outline" className="h-11 rounded-2xl">
                    Detail
                </Button>
            </div>
        </CardContent>
    </Card>
);
}
