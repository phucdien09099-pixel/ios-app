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
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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

                    <Dialog>
                        <DialogContent
                            className="z-[9999]! pointer-events-auto!"
                        >
                            <DialogTrigger>
                                <Button size="icon-lg" variant="outline" title="Thêm nút" aria-label="Thêm nút" >
                                    {/* <HugeiconsIcon icon={Add01Icon} /> */}
                                    hello
                                </Button>
                            </DialogTrigger>
                            {/* <DialogHeader>
                        <DialogTitle>{editingId ? "Sửa nút remote" : "Thêm nút remote"}</DialogTitle>
                        <DialogDescription>Chọn icon và đặt mã nút để học hoặc gửi lại tín hiệu.</DialogDescription>
                    </DialogHeader>
                    

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
                 */}
                        </DialogContent>
                    </Dialog >
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
                            component: AddRoom,
                        })}>
                        <HugeiconsIcon icon={PlusSignIcon} />
                    </Button>
                    {/* USER */}
                    <Button
                        onClick={() => open({
                            id: "user",
                            title: "",
                            component: UserPage,
                            renderRightButtonHeader:
                                <>
                                    <Button
                                        className="rounded-2xl"
                                        variant="outline"
                                        onClick={() => open({
                                            id: "qr_pair",
                                            title: "",
                                            component: () => { },
                                        })}>
                                        <HugeiconsIcon icon={ScanBarcode} />
                                    </Button>
                                    <Button
                                        className="rounded-2xl"
                                        variant="outline"
                                        onClick={() => open({
                                            id: "qr_pair",
                                            title: "",
                                            component: () => { },
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
