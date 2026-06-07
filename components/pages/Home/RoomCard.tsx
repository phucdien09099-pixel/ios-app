import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DevicesRoom from "../Room";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
    DashboardCircleAddIcon,
    Setting06Icon,
    Delete02Icon, // hoặc icon delete bạn đang dùng trong bộ icon
} from "@hugeicons/core-free-icons";
import HubSettings from "../HubSettings";
import AddDeviceForm from "../AdditionalDevice";
import { Room } from "@/db/types/room";
import { Badge } from "@/components/ui/badge";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import { roomRepo } from "@/db/repository/RoomRepository";
import { toast } from "sonner";
import { useEffect } from "react";

export function RoomCard({ room, onDeleted }: { room: Room, onDeleted: () => Promise<void>; }) {
    const { open } = useNavDrawer();
    const { deviceStates, getDeviceStatus } = useTransport();

    const handleDeleteRoom = async (idRoom: any) => {
        try {
            await roomRepo.deleteRoom(idRoom);
            toast.success("Room deleted");
            await onDeleted()
        } catch (error) {
            toast.success("Delete Fail");
        }
    }

    // console.log(room.name)
    return (
        <Card className="hover:shadow-md transition cursor-pointer"   >
            {/* HEADER */}
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-base leading-none">
                        {room.name}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground">
                        {room.note || "No description"}
                    </div>
                    {/* STATUS */}

                </div>

                {/* DELETE */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 -mt-1"
                    onClick={(e) => { handleDeleteRoom(room.id); }}>
                    <HugeiconsIcon icon={Delete02Icon} />
                </Button>
            </CardHeader>

            {/* BODY */}
            <CardContent className="flex flex-col gap-2 pt-0">
                <Badge
                    variant="outline"
                    className={`w-fit flex items-center gap-1 ${getDeviceStatus(room.name)
                        ? "text-green-600 border-green-200 bg-green-50"
                        : "text-red-600 border-red-200 bg-red-50"
                        }`}>
                    {getDeviceStatus(room.name) ? "online" : "offline"}
                </Badge>
                <div className="text-sm font-medium">
                    {room?.devices?.length || 0} devices
                </div>
                <Button onClick={() => {
                    console.log(room);
                    open({
                        id: room.id,
                        title: room.name,
                        component: DevicesRoom,
                        props: {
                            onload: onDeleted
                            , roomId: room.id
                            , roomName: room.name
                        },
                        direction: "right",
                        renderRightButtonHeader: (
                            <>
                                <Button
                                    onClick={() =>
                                        open({
                                            id: "addition_device",
                                            title: "Thêm thiết bị",
                                            direction: "right",
                                            component: AddDeviceForm,
                                            props: {
                                                roomId: room.id,
                                                roomName: room.name
                                            }
                                        })
                                    }>
                                    <HugeiconsIcon icon={DashboardCircleAddIcon} />
                                </Button>

                                <Button
                                    onClick={() =>
                                        open({
                                            id: room.id + "setting",
                                            title: room.name,
                                            direction: "right",
                                            component: HubSettings,
                                        })
                                    }
                                >
                                    <HugeiconsIcon icon={Setting06Icon} />
                                </Button>
                            </>
                        ),
                    })
                }} size="sm" variant="outline">
                    Detail
                </Button>
            </CardContent>
        </Card >
    );
}
