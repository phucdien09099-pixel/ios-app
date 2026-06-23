import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DevicesRoom from "../Room";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
    DashboardCircleAddIcon,
    Setting06Icon,
    Delete02Icon,
    TemperatureIcon, // hoặc icon delete bạn đang dùng trong bộ icon
} from "@hugeicons/core-free-icons";
import HubSettings from "../HubSettings";
import AddDeviceForm from "../AdditionalDevice";
import { Room } from "@/db/types/room";
import { Badge } from "@/components/ui/badge";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import { roomRepo } from "@/db/repository/RoomRepository";
import { toast } from "sonner";
import { detailTourObj } from "@/components/onboarding/tours/afterAddRoomTour";
import HelpButton from "@/components/common/HelpButton";
import { startAfterAddDeviceTour } from "@/components/onboarding/tours/afterAddDeviceTour";
import { startAddDeviceTour } from "@/components/onboarding/tours/addDeviceTour";
import { startHubSettingTour } from "@/components/onboarding/tours/hubSettingTour";
import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function RoomCard({ 
    room, 
    onDeleted, 
    dataTour 
}: { 
    room: Room, 
    onDeleted: () => Promise<void>; 
    dataTour?: string; 
}) {
    const { open } = useNavDrawer();
    const { deviceStates, getDeviceStatus } = useTransport();
    const currentRoomState = deviceStates[room.name];
    const currentTemp = currentRoomState?.temp;
    const [openDelete, setOpenDelete] = useState(false);


    const handleDeleteRoom = async (idRoom: any) => {
        try {
            await roomRepo.deleteRoom(idRoom);
            toast.success("Room deleted");
            await onDeleted()
        } catch (error) {
            toast.success("Delete Fail");
        }
    }

    return (
    <Card className="hover:shadow-md transition cursor-pointer" data-tour={dataTour}>
        {/* HEADER */}
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="flex flex-col gap-1">
                <CardTitle className="text-base leading-none">
                    {room.name}
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                    {room.note || "No description"}
                </div>
            </div>

            {/* DELETE */}
            <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600 -mt-1"
                onClick={(e) => { 
                    e.stopPropagation(); // Ngăn sự kiện click lan ra Card
                    setOpenDelete(true); 
                }}
            >
                <HugeiconsIcon icon={Delete02Icon} />
            </Button>

            <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
                <AlertDialogContent className="w-[280px] rounded-[24px] bg-white p-5 shadow-xl border-none gap-0">
                    {/* Phần chữ trung tâm */}
                    <div className="flex flex-col items-center text-center mt-1 mb-5 gap-1.5">
                        <AlertDialogTitle className="text-[17px] font-semibold text-gray-900">
                            Xoá phòng
                        </AlertDialogTitle>
                        <p className="text-[13px] text-gray-500 leading-relaxed px-2">
                            Phòng sẽ bị xoá khỏi tài khoản. <br />
                            Bạn có chắc chắn muốn xoá?
                        </p>
                    </div>
                    
                    {/* Hai nút chức năng bo góc tròn */}
                    <div className="flex justify-center gap-3 w-full">
                        <Button 
                            variant="secondary" 
                            className="flex-1 rounded-full h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm" 
                            onClick={(e) => { e.stopPropagation(); setOpenDelete(false); }}
                        >
                            Huỷ
                        </Button>
                        <Button 
                            variant="destructive" 
                            className="flex-1 rounded-full h-10 bg-[#f43f5e] hover:bg-[#e11d48] text-white font-medium text-sm shadow-none" 
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenDelete(false);
                                handleDeleteRoom(room.id);
                            }}
                        >
                            Xoá
                        </Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </CardHeader>

        {/* BODY */}
        <CardContent className="gap-2 pt-0 grid grid-cols-2">
            <Badge
                variant="outline"
                className={`w-fit flex items-center gap-1 ${
                    getDeviceStatus(room.name)
                        ? "text-green-600 border-green-200 bg-green-50"
                        : "text-red-600 border-red-200 bg-red-50"
                }`}
            >
                {getDeviceStatus(room.name) ? "online" : "offline"}
            </Badge>

            {typeof currentTemp === "number" && currentTemp > 0 && (
                <Badge
                    variant="outline"
                    className="flex items-center gap-1 border-orange-200 bg-orange-50 text-orange-700 font-semibold w-fit"
                >
                    <HugeiconsIcon icon={TemperatureIcon} className="text-orange-600" />
                    {currentTemp} °C
                </Badge>
            )}

            <div className="col-span-2">
                <div className="text-sm font-medium">
                    {room?.devices?.length || 0} devices
                </div>
                
                <Button 
                    data-tour={`detail-btn-${room.id}`}
                    className="w-full"
                    size="sm"
                    onClick={() => {
                        if (typeof detailTourObj !== "undefined" && detailTourObj !== null) {
                            detailTourObj.destroy();
                        }
                        const pointer = document.getElementById('tour-finger-pointer');
                        if (pointer) pointer.remove();

                        open({
                            id: room.id,
                            title: room.name,
                            component: DevicesRoom,
                            props: {
                                onload: onDeleted,
                                roomId: room.id,
                                roomName: room.name
                            },
                            direction: "right",
                            renderRightButtonHeader: (
                                <div className="flex items-center gap-2">
                                    <HelpButton onClick={() => startAfterAddDeviceTour(true)} />
                                    
                                    {/* NÚT 2: Nút Thêm Thiết bị */}
                                    <Button
                                        data-tour="header-add-device-btn"
                                        size="icon" 
                                        className="w-8 h-8 shrink-0 rounded-md"
                                        onClick={() =>
                                            open({
                                                id: "addition_device",
                                                title: "Thêm thiết bị",
                                                direction: "right",
                                                component: AddDeviceForm,
                                                renderRightButtonHeader: <HelpButton onClick={() => startAddDeviceTour(true)} />,
                                                props: {
                                                    roomId: room.id,
                                                    roomName: room.name
                                                }
                                            })
                                        }
                                    >
                                        <HugeiconsIcon icon={DashboardCircleAddIcon} size={18} />
                                    </Button>

                                    {/* NÚT 3: Nút Hub Setting */}
                                    <Button
                                        data-tour="detail-btn-inside"
                                        size="icon" 
                                        className="w-8 h-8 shrink-0 rounded-md transition-all duration-300" 
                                        onClick={() =>
                                            open({
                                                id: room.id + "setting",
                                                title: "Cài đặt Hub",
                                                direction: "right",
                                                component: HubSettings,
                                                props: {
                                                    roomName: room.name
                                                },
                                                renderRightButtonHeader: <HelpButton onClick={() => startHubSettingTour(true)} />
                                            })
                                        }
                                    >
                                        <HugeiconsIcon icon={Setting06Icon} size={18} />
                                    </Button>
                                </div>
                            ),
                        });
                    }} 
                >
                    Detail
                </Button>
            </div>
        </CardContent>
    </Card>
);
}
