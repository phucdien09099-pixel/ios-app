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
import WelcomeModal from "@/components/onboarding/WelcomeModal";
import { useWelcomeModal } from "@/components/onboarding/useWelcomeModal";
import PullDownGuide from "@/components/onboarding/PullDownGuide";
import { startDetailTour } from "@/components/onboarding/tours/afterAddRoomTour";
import { homeDriverObj, startHomeTour } from "@/components/onboarding/tours/homeTour";
import HelpButton from "@/components/common/HelpButton";
import { startRoomTour } from "@/components/onboarding/tours/roomTour";
import { useTransport } from "@/components/providers/transport/TransportProvider";

const PENDING_DETAIL_ROOM_ID = "tour:pendingDetailRoomId";

export function RoomPage() {
    const { open } = useNavDrawer();
    const { refreshConnection } = useTransport();
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
        return data;
        // console.log("fetch new data");
    }

    async function handleRefresh() {
        const [data] = await Promise.all([
            load(),
            refreshConnection(),
        ]);

        if (!guideType) return;

        if (guideType === "room" && newRoomId) {
            const isDetailTourSkipped = localStorage.getItem("tour:detail") === "1";
            const createdRoomVisible = data.some((room) => room.id === newRoomId);

            localStorage.removeItem("JUST_CREATED_ROOM_ID");
            setGuideType(null);
            setNewRoomId(null);

            if (createdRoomVisible && !isDetailTourSkipped) {
                setTimeout(() => {
                    startDetailTour(newRoomId);
                }, 600);
            }
        } else if (guideType === "device") {
            // Dọn dẹp cờ lưu trữ thiết bị
            localStorage.removeItem("JUST_ADDED_DEVICE");
            setGuideType(null);

            // Nếu sau này bạn có Tour phụ giới thiệu tính năng của thiết bị, bạn kích hoạt ở đây nhé:
            // setTimeout(() => { startDeviceTour(); }, 600);
        }
    }

    useEffect(() => {
        const checkTargetCreated = (currentRooms: Room[] = rooms, options?: { startDetailOnVisible?: boolean }) => {
            const shouldStartDetail = options?.startDetailOnVisible ?? false;
            const justCreatedId = localStorage.getItem("JUST_CREATED_ROOM_ID");
            const isDetailTourSkipped = localStorage.getItem("tour:detail") === "1";
            if (justCreatedId) {
                const createdRoomVisible = currentRooms.some((room) => room.id === justCreatedId);

                if (createdRoomVisible && shouldStartDetail) {
                    localStorage.removeItem("JUST_CREATED_ROOM_ID");
                    setGuideType(null);
                    setNewRoomId(null);

                    if (!isDetailTourSkipped) {
                        setTimeout(() => {
                            startDetailTour(justCreatedId);
                        }, 600);
                    }
                    return;
                }

                if (createdRoomVisible || isDetailTourSkipped) {
                    setGuideType(null);
                    setNewRoomId(justCreatedId);
                    return;
                }

                setGuideType("room");
                setNewRoomId(justCreatedId);
                return;
            }

            const justAddedDevice = localStorage.getItem("JUST_ADDED_DEVICE");
            if (justAddedDevice) {
                const hasVisibleDevice = currentRooms.some((room) => (room.devices?.length ?? 0) > 0);
                const isAfterAddDeviceSkipped = localStorage.getItem("tour:afterAddDevice") === "1";

                if (hasVisibleDevice || isAfterAddDeviceSkipped) {
                    localStorage.removeItem("JUST_ADDED_DEVICE");
                    setGuideType(null);
                    return;
                }

                setGuideType("device");
                return;
            }

            setGuideType(null);
        };

        void load().then(checkTargetCreated);

        const handleDataCreated = async () => {
            await load();
            const justCreatedId = localStorage.getItem("JUST_CREATED_ROOM_ID");
            if (justCreatedId) {
                sessionStorage.setItem(PENDING_DETAIL_ROOM_ID, justCreatedId);
            }
        };

        const handleDrawerClosed = async (event: Event) => {
            const pageId = (event as CustomEvent<{ pageId?: string }>).detail?.pageId;
            if (pageId !== "addition_room") return;

            const pendingRoomId = sessionStorage.getItem(PENDING_DETAIL_ROOM_ID);
            if (!pendingRoomId) return;

            const data = await load();
            localStorage.setItem("JUST_CREATED_ROOM_ID", pendingRoomId);
            sessionStorage.removeItem(PENDING_DETAIL_ROOM_ID);
            checkTargetCreated(data, { startDetailOnVisible: true });
        };

        const handleFocus = async () => {
            const data = await load();
            if (localStorage.getItem("JUST_CREATED_ROOM_ID")) return;
            checkTargetCreated(data);
        };

        window.addEventListener("focus", handleFocus);
        window.addEventListener("room-created", handleDataCreated);
        window.addEventListener("device-created", handleDataCreated);
        window.addEventListener("drawer-closed", handleDrawerClosed);

        return () => {
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("room-created", handleDataCreated);
            window.removeEventListener("device-created", handleDataCreated);
            window.removeEventListener("drawer-closed", handleDrawerClosed);
            if (homeDriverObj) {
                homeDriverObj.destroy();
            }
        };

    }, []);

    return (
        <div className="m-4 mt-10!">
            {/* HEADER */}
            <header className="mb-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                        Smart IR
                    </h3>

                    <div className="flex items-center gap-2">
                        <HelpButton onClick={() => startHomeTour(true)} />
                        <Button
                            onClick={() => open({
                                id: "user",
                                title: "",
                                component: UserPage,
                                renderRightButtonHeader:
                                    <>
                                        <Button
                                            size="lg"
                                            className="rounded-2xl"
                                            variant="outline"
                                            onClick={() => open({
                                                id: "qr_pair",
                                                title: "",
                                                component: () => <></>,
                                            })}>
                                            <HugeiconsIcon data-icon="inline-start" icon={ScanBarcode} />
                                            Quét QR
                                        </Button>
                                        <Button
                                            size="lg"
                                            className="rounded-2xl"
                                            variant="outline"
                                            onClick={() => open({
                                                id: "qr_pair",
                                                title: "",
                                                component: () => <></>,
                                            })}>
                                            <HugeiconsIcon data-icon="inline-start" icon={Setting06FreeIcons} />
                                            Cài đặt
                                        </Button>
                                    </>
                            })}
                            variant="outline"
                            size="icon"
                            className="size-10! rounded-2xl">
                            <HugeiconsIcon icon={UserIcon} />
                        </Button>
                    </div>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                    HUB điều khiển hồng ngoại
                </p>

                <div className="flex items-center justify-start">
                    <Button
                        data-tour="add-room-button"
                        size="lg"
                        className="text-md rounded-xl"
                        onClick={() => open({
                            id: "addition_room",
                            title: "Thêm Room",
                            component: AddRoom,
                            renderHelpButtonHeader: <HelpButton onClick={() => startRoomTour(true)} />
                        })}>
                        <HugeiconsIcon data-icon="inline-start" icon={PlusSignIcon} />
                        Thêm Room
                    </Button>
                </div>
            </header>

            <AppPullToRefresh className="min-h-[calc(100dvh-13rem)]" onRefresh={handleRefresh}>
                {rooms.length === 0 && <EmptyRoom />}
                {/* ROOMS */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 m-1">
                    {rooms.map((room) => (
                        <div key={room.id} data-tour={`room-card-${room.id}`}>
                            <RoomCard
                                room={room}
                                onDeleted={async () => {
                                    await load();
                                }}
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
