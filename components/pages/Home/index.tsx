import { useEffect, useState } from "react";
import { EmptyRoom } from "./EmptyRoom";
import { Button } from "@/components/ui/button";
import AddRoom from "../AdditionalRoom";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, ScanBarcode, Setting06FreeIcons, UserIcon } from "@hugeicons/core-free-icons";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { roomRepo } from "@/db/repository/RoomRepository";
import { Room } from "@/db/types/room";
import { RoomCard } from "./RoomCard";
import AppPullToRefresh from "@/components/common/AppPull2Refresh";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import UserPage from "../User";

export function RoomPage() {
    const { open } = useNavDrawer();
    const [rooms, setRooms] = useState<Room[]>([]);

    async function load() {
        const data = await roomRepo.getRoomsWithDevices();
        setRooms(data);
        console.log("fetch new data")
    }
    useEffect(() => {
        load()
    }, []);

    return (
        <div className="mt-10! m-4">
            {/* HEADER */}
            <div className="mb-4 flex items-start justify-between gap-4">
                {/* LEFT */}
                <div>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                        Smart IR
                    </h3>

                    <p className="leading-7 text-muted-foreground">
                        HUB điều khiển hồng ngoại
                    </p>
                </div>
                {/* RIGHT ACTIONS */}
                <div className="flex items-center gap-2">
                    <Button
                        className="rounded-2xl size-10!"
                        variant="outline"
                        onClick={() => open({
                            id: "addition_room",
                            title: "Thêm Room",
                            element: <AddRoom />,
                        })}>
                        <HugeiconsIcon icon={PlusSignIcon} />
                    </Button>
                    {/* USER */}
                    <Button
                        onClick={() => open({
                            id: "user",
                            title: "",
                            element: <UserPage />,
                            renderRightButtonHeader:
                                <>
                                    <Button
                                        className="rounded-2xl"
                                        variant="outline"
                                        onClick={() => open({
                                            id: "qr_pair",
                                            title: "",
                                            element: <></>,
                                        })}>
                                        <HugeiconsIcon icon={ScanBarcode} />
                                    </Button>
                                    <Button
                                        className="rounded-2xl"
                                        variant="outline"
                                        onClick={() => open({
                                            id: "qr_pair",
                                            title: "",
                                            element: <></>,
                                        })}>
                                        <HugeiconsIcon icon={Setting06FreeIcons} />
                                    </Button>
                                </>
                        })}
                        variant="outline"
                        size="icon"
                        className="rounded-2xl size-10!">
                        <HugeiconsIcon className="" icon={UserIcon} />
                    </Button>

                    {/* ADD ROOM */}


                </div>

            </div>
            <AppPullToRefresh onRefresh={load}>
                {rooms.length === 0 && <EmptyRoom />}
                {/* ROOMS */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 m-1">
                    {rooms.map((room) => (
                        <RoomCard
                            key={room.id}
                            room={room}
                            onDeleted={load}
                        />
                    ))}
                </div>
            </AppPullToRefresh>

        </div >
    );
}
