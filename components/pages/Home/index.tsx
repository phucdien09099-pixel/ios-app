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
import UserPage from "../User";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import WelcomeModal from "@/components/onboarding/WelcomeModal";
import { useWelcomeModal } from "@/components/onboarding/useWelcomeModal";
import PullDownGuide from "@/components/onboarding/PullDownGuide";
import { startDetailTour } from "@/components/onboarding/tours/afterAddRoomTour";
import { homeDriverObj,startHomeTour } from "@/components/onboarding/tours/homeTour";
import HelpButton from "@/components/common/HelpButton";
import { startRoomTour } from "@/components/onboarding/tours/roomTour";


export function RoomPage() {
    const { open } = useNavDrawer();
    const [rooms, setRooms] = useState<Room[]>([]);

    const [guideType, setGuideType] = useState<"room" | "device" | null>(null);
    const [newRoomId, setNewRoomId] = useState<string | null>(null);

    const {
        showWelcome,
        checkWelcome,
        handleStart,
        handleSkip,
    } = useWelcomeModal();

    async function load() {
        const data = await roomRepo.getRoomsWithDevices();
        setRooms(data);
        checkWelcome(data.length);
        // console.log("fetch new data");
    }

    async function handleRefresh() {
        await load(); 

        if (!guideType) return;

        if (guideType === "room" && newRoomId) {
            localStorage.removeItem("JUST_CREATED_ROOM_ID"); 
            setGuideType(null); 

            setTimeout(() => {
                startDetailTour(newRoomId); 
            }, 600);
        } else if (guideType === "device") {
            // Dọn dẹp cờ lưu trữ thiết bị
            localStorage.removeItem("JUST_ADDED_DEVICE");
            setGuideType(null);
            
            // Nếu sau này bạn có Tour phụ giới thiệu tính năng của thiết bị, bạn kích hoạt ở đây nhé:
            // setTimeout(() => { startDeviceTour(); }, 600);
        }
    }

    useEffect(() => {
        load();

        const checkTargetCreated = () => {
            const justCreatedId = localStorage.getItem("JUST_CREATED_ROOM_ID");
            const isDetailTourSkipped = localStorage.getItem("tour:detail") === "1";
            if (justCreatedId && !isDetailTourSkipped) { 
                setGuideType("room");
                setNewRoomId(justCreatedId);
                return;
            }
            if (justCreatedId) {
                setGuideType("room");
                setNewRoomId(justCreatedId);
                return;
            }

            const justAddedDevice = localStorage.getItem("JUST_ADDED_DEVICE");
            if (justAddedDevice) {
                setGuideType("device");
            }
        };

        checkTargetCreated(); 
        window.addEventListener("focus", checkTargetCreated);
        window.addEventListener("room-created", checkTargetCreated);
        window.addEventListener("device-created", checkTargetCreated);

        return () => {
            window.removeEventListener("focus", checkTargetCreated);
            window.removeEventListener("room-created", checkTargetCreated);
            window.removeEventListener("device-created", checkTargetCreated);
            if (homeDriverObj) {
                homeDriverObj.destroy();
            }
        };
        
    }, []);

    return (
        <div className="mt-10! m-4">
            {/* HEADER */}
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                        Smart IR
                    </h3>
                    <Dialog>
                        <DialogContent className="z-[9999]! pointer-events-auto!">
                            <DialogTrigger>
                                <Button size="icon-lg" variant="outline" title="Thêm nút" aria-label="Thêm nút">
                                    hello
                                </Button>
                            </DialogTrigger>
                        </DialogContent>
                    </Dialog>
                    <p className="leading-7 text-muted-foreground">
                        HUB điều khiển hồng ngoại
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <HelpButton onClick={() => startHomeTour(true)} />
                    <Button
                        data-tour="add-room-button"
                        className="rounded-2xl size-10!"
                        variant="outline"
                        onClick={() => open({
                            id: "addition_room",
                            title: "Thêm Room",
                            component: AddRoom,
                            renderRightButtonHeader: <HelpButton onClick={() => startRoomTour(true)} />
                        })}>
                        <HugeiconsIcon icon={PlusSignIcon} />
                    </Button>

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
                </div>
            </div>

            <AppPullToRefresh onRefresh={handleRefresh}>
                {rooms.length === 0 && <EmptyRoom />}
                {/* ROOMS */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 m-1">
                    {rooms.map((room) => ( 
                        <div key={room.id} data-tour={`room-card-${room.id}`}>
                            <RoomCard
                                room={room}
                                onDeleted={load}
                            />
                        </div>
                    ))}
                </div>
            </AppPullToRefresh>

            <WelcomeModal
                open={showWelcome}
                onStart={handleStart}
                onSkip={handleSkip}
            />

            {guideType && <PullDownGuide type={guideType} />}
        </div>
    );
}