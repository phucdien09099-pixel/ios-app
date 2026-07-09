import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DevicesRoom from "../Room";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
    DashboardCircleAddIcon,
    Clock01Icon,
    Setting06Icon,
    Delete02Icon,
    Loading01Icon,
    TemperatureIcon,
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
import { startAlarmTour } from "@/components/onboarding/tours/alarmTour";
import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AlarmSettings from "../Room/AlarmSettings";
import { deleteServerRoom } from "@/libs/smartSync";
import { startEmptyRoomTour } from "@/components/onboarding/tours/emptyRoomTour";
export function RoomCard({
    room,
    onDeleted,
    onRefresh,
    isRefreshing = false,
    dataTour
}: {
    room: Room,
    onDeleted: () => Promise<void>;
    onRefresh?: () => Promise<void>;
    isRefreshing?: boolean;
    dataTour?: string;
}) {
    const { open } = useNavDrawer();
    const { deviceStates, getDeviceStatus } = useTransport();
    const currentRoomState = deviceStates[room.name];
    const currentTemp = currentRoomState?.temp;
    const [openDelete, setOpenDelete] = useState(false);
    const isOnline = getDeviceStatus(room.name);
    const deviceCount = room?.devices?.length || 0;


    const handleDeleteRoom = async (idRoom: any) => {
        try {
            if (localStorage.getItem("access_token")) {
                await deleteServerRoom(String(idRoom));
            }
            await roomRepo.deleteRoom(idRoom);
            toast.success("Đã xoá phòng trên server và máy này");
            await onDeleted()
        } catch (error) {
            console.error("Không thể xoá phòng:", error);
            toast.error("Không thể xoá phòng. Vui lòng thử đồng bộ lại hoặc kiểm tra quyền tài khoản.");
        }
    }

    return (
        <Card className="group overflow-hidden rounded-3xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" data-tour={dataTour}>
            {/* HEADER */}
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
                <div className="flex flex-col gap-1">
                    <CardTitle className="truncate text-lg leading-none">
                        {room.name}
                    </CardTitle>
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                        {room.note || ""}
                    </div>
                </div>

                {/* DELETE */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0 rounded-2xl text-muted-foreground opacity-70 transition-opacity hover:text-red-600 group-hover:opacity-100"
                    onClick={(e) => {
                        e.stopPropagation();
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
            <CardContent className="grid grid-cols-2 gap-3 pt-0">
                <Badge
                    variant="outline"
                    className={`w-fit rounded-full px-2.5 py-1 flex items-center gap-1 ${isOnline
                        ? "text-green-600 border-green-200 bg-green-50"
                        : "text-red-600 border-red-200 bg-red-50"
                        }`}
                >
                    <span className={`size-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                    {isOnline ? "online" : "offline"}
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
                    <div className="mb-3 rounded-2xl bg-muted/60 p-3">
                        <div className="text-sm font-semibold">
                            {deviceCount} Thiết bị
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {isOnline ? "Hub đang phản hồi" : "Chưa nhận trạng thái mới"}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2" >
                        <Button
                            data-tour={`detail-btn-${room.id}`}
                            className="h-11 w-full rounded-2xl"
                            size="lg"
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
                                        onLoad: onDeleted,
                                        roomId: room.id,
                                        roomName: room.name
                                    },
                                    direction: "right",
                                    renderHelpButtonHeader: (
                                        <HelpButton 
                                            onClick={() => {
                                                if (deviceCount === 0) {
                                                    startEmptyRoomTour(true);
                                                } else {
                                                    startAfterAddDeviceTour(true);
                                                }
                                            }} 
                                        />
                                    ),
                                    renderRightButtonHeader: (
                                        <div className="flex items-center gap-2">
                                            {/* NÚT 2: Nút Thêm Thiết bị */}
                                            <Button
                                                data-tour="header-add-device-btn"
                                                size="lg"
                                                className="text-md shrink-0 rounded-xl!"
                                                onClick={() =>
                                                    open({
                                                        id: "addition_device",
                                                        title: "Thêm thiết bị",
                                                        direction: "right",
                                                        component: AddDeviceForm,
                                                        renderHelpButtonHeader: <HelpButton onClick={() => startAddDeviceTour(true)} />,
                                                        props: {
                                                            roomId: room.id,
                                                            roomName: room.name
                                                        }
                                                    })
                                                }
                                            >
                                                <HugeiconsIcon data-icon="inline-start" icon={DashboardCircleAddIcon} />
                                                Thêm thiết bị
                                            </Button>

                                            <Button
                                            data-tour="alarm-settings-btn"
                                                size="lg"
                                                className="text-md shrink-0 rounded-xl!"
                                                onClick={() =>
                                                    open({
                                                        id: `${room.id}-alarm-settings`,
                                                        title: "Cài đặt báo thức",
                                                        direction: "right",
                                                        component: AlarmSettings,
                                                        props: { roomId: room.id, roomName: room.name },
                                                        renderHelpButtonHeader: <HelpButton onClick={() => startAlarmTour()} />
                                                    })
                                                }
                                            >
                                                <HugeiconsIcon data-icon="inline-start" icon={Clock01Icon} />
                                                Báo thức
                                            </Button>

                                            {/* NÚT 3: Nút Hub Setting */}
                                            <Button
                                                data-tour="detail-btn-inside"
                                                size="lg"
                                                className="text-md shrink-0 rounded-xl! transition-all duration-300"
                                                onClick={() =>
                                                    open({
                                                        id: room.id + "setting",
                                                        title: "Cài đặt",
                                                        direction: "right",
                                                        component: HubSettings,
                                                        props: {
                                                            roomName: room.name
                                                        },
                                                        renderHelpButtonHeader: <HelpButton onClick={() => startHubSettingTour(true)} />
                                                    })
                                                }
                                            >
                                                <HugeiconsIcon data-icon="inline-start" icon={Setting06Icon} />
                                                Cài đặt
                                            </Button>
                                        </div>
                                    ),
                                });
                            }}>
                            Vào phòng
                        </Button>
                        <Button
                            className="h-11 w-full rounded-2xl"
                            variant="outline"
                            disabled={isRefreshing}
                            onClick={async (event) => {
                                event.stopPropagation();
                                await onRefresh?.();
                            }}
                        >
                            {isRefreshing ? (
                                <HugeiconsIcon data-icon="inline-start" icon={Loading01Icon} className="animate-spin" />
                            ) : null}
                            {isRefreshing ? "Đang làm mới" : "Làm mới"}
                        </Button>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
