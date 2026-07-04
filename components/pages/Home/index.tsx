import { useEffect, useState } from "react";
import { EmptyRoom } from "./EmptyRoom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddRoom from "../AdditionalRoom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading01Icon, PlusSignIcon, RefreshIcon, UserIcon } from "@hugeicons/core-free-icons";
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
import { toast } from "sonner";
import { hasServerSmartData, syncSmartDataFromServer } from "@/libs/smartSync";

const PENDING_DETAIL_ROOM_ID = "tour:pendingDetailRoomId";

export function RoomPage() {
    const { open } = useNavDrawer();
    const { refreshConnection, getDeviceStatus } = useTransport();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [refreshingRoomId, setRefreshingRoomId] = useState<string | null>(null);
    const [syncingServer, setSyncingServer] = useState(false);

    const [guideType, setGuideType] = useState<"room" | "device" | null>(null);
    const [newRoomId, setNewRoomId] = useState<string | null>(null);

    const {
        showWelcome,
        checkWelcome,
        handleStart,
        handleSkip,
    } = useWelcomeModal();

    const totalDevices = rooms.reduce((total, room) => total + (room.devices?.length ?? 0), 0);
    const onlineRooms = rooms.filter((room) => getDeviceStatus(room.name)).length;

    async function load() {
        const data = await roomRepo.getRoomsWithDevices();
        setRooms(data);
        checkWelcome(data.length);
        return data;
        // console.log("fetch new data");
    }

    async function promptServerSyncIfNeeded(currentRooms: Room[]) {
        if (currentRooms.length > 0) return;
        if (syncingServer) return;
        if (sessionStorage.getItem("smart:syncPromptShown") === "1") return;
        if (!localStorage.getItem("access_token")) return;

        sessionStorage.setItem("smart:syncPromptShown", "1");

        try {
            const hasData = await hasServerSmartData();
            if (!hasData) return;

            toast("Có dữ liệu Smart IR trên server", {
                description: "Bạn có muốn đồng bộ room và thiết bị về máy này không?",
                duration: 10000,
                action: {
                    label: "Đồng bộ",
                    onClick: async () => {
                        try {
                            setSyncingServer(true);
                            const result = await syncSmartDataFromServer({ replaceLocal: true });
                            const data = await load();
                            await refreshConnection();
                            toast.success(`Đã đồng bộ ${result.rooms} room, ${result.devices} thiết bị`);
                            checkWelcome(data.length);
                        } catch (error) {
                            console.error("Không thể đồng bộ dữ liệu server:", error);
                            toast.error("Không thể đồng bộ dữ liệu từ server");
                            sessionStorage.removeItem("smart:syncPromptShown");
                        } finally {
                            setSyncingServer(false);
                        }
                    },
                },
            });
        } catch (error) {
            console.error("Không thể kiểm tra dữ liệu server:", error);
            sessionStorage.removeItem("smart:syncPromptShown");
        }
    }

    async function handleSyncFromServer(options?: { silent?: boolean }) {
        if (!localStorage.getItem("access_token")) {
            toast.error("Vui lòng đăng nhập để đồng bộ dữ liệu");
            return;
        }

        setSyncingServer(true);
        try {
            const result = await syncSmartDataFromServer({ replaceLocal: true });
            const data = await load();
            await refreshConnection();
            checkWelcome(data.length);

            if (!options?.silent) {
                toast.success(`Đã đồng bộ ${result.rooms} phòng, ${result.devices} thiết bị`);
            }

            return data;
        } catch (error) {
            console.error("Không thể đồng bộ dữ liệu server:", error);
            if (!options?.silent) {
                toast.error("Không thể đồng bộ dữ liệu từ server");
            }
            throw error;
        } finally {
            setSyncingServer(false);
        }
    }

    async function handleRefresh() {
        let data: Room[];
        try {
            data = await handleSyncFromServer({ silent: true }) ?? await load();
        } catch {
            [data] = await Promise.all([
                load(),
                refreshConnection(),
            ]);
        }

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

    async function handleRefreshRoom(roomId: string) {
        setRefreshingRoomId(roomId);
        try {
            await Promise.all([
                load(),
                refreshConnection(),
            ]);
            toast.success("Đã làm mới kết nối thiết bị");
        } catch (error) {
            console.error("Không thể làm mới kết nối:", error);
            toast.error("Không thể làm mới kết nối thiết bị");
        } finally {
            setRefreshingRoomId(null);
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

        void load().then((data) => {
            checkTargetCreated(data);
            void promptServerSyncIfNeeded(data);
        });

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
            void promptServerSyncIfNeeded(data);
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
        <div className="m-4 mt-8!">
            {/* HEADER */}
            <header className="mb-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="scroll-m-20 truncate text-3xl font-semibold tracking-tight">
                                Smart IR
                            </h3>
                            <Badge variant="outline" className="rounded-full">
                                {onlineRooms}/{rooms.length} online
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Điều khiển Hub hồng ngoại và thiết bị trong nhà của bạn.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <HelpButton onClick={() => startHomeTour(true)} />
                        <Button
                            onClick={() => open({
                                id: "user",
                                title: "",
                                component: UserPage,
                                renderRightButtonHeader:
                                    <></>
                            })}
                            variant="outline"
                            size="icon"
                            className="size-10! rounded-2xl">
                            <HugeiconsIcon icon={UserIcon} />
                        </Button>
                    </div>
                </div>

                {/* <p className="text-sm leading-6 text-muted-foreground">
                    HUB điều khiển hồng ngoại
                </p> */}

                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border bg-card p-3 shadow-sm">
                        <p className="text-[11px] text-muted-foreground">Phòng</p>
                        <p className="text-lg font-semibold">{rooms.length}</p>
                    </div>
                    <div className="rounded-2xl border bg-card p-3 shadow-sm">
                        <p className="text-[11px] text-muted-foreground">Thiết bị</p>
                        <p className="text-lg font-semibold">{totalDevices}</p>
                    </div>
                    <div className="rounded-2xl border bg-card p-3 shadow-sm">
                        <p className="text-[11px] text-muted-foreground">Kết nối</p>
                        <p className="text-lg font-semibold text-green-600">{onlineRooms}</p>
                    </div>
                </div>

                <div className="grid grid-cols-[7fr_3fr] gap-2 w-full">
                    <Button
                        data-tour="add-room-button"
                        size="lg"
                        className="h-12  rounded-2xl text-md sm:w-auto"
                        onClick={() => open({
                            id: "addition_room",
                            title: "Thêm Phòng",
                            component: AddRoom,
                            renderHelpButtonHeader: <HelpButton onClick={() => startRoomTour(true)} />
                        })}>
                        <HugeiconsIcon data-icon="inline-start" icon={PlusSignIcon} />
                        Thêm Phòng
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        className="h-12 rounded-2xl text-md sm:w-auto"
                        disabled={syncingServer}
                        onClick={() => handleSyncFromServer()}
                    >
                        <HugeiconsIcon
                            data-icon="inline-start"
                            icon={syncingServer ? Loading01Icon : RefreshIcon}
                            className={syncingServer ? "animate-spin" : ""}
                        />
                        {syncingServer ? "Đang đồng bộ" : "Đồng bộ"}
                    </Button>
                </div>
            </header>

            <AppPullToRefresh className="min-h-[calc(89dvh-13rem)]" onRefresh={handleRefresh}>
                {rooms.length === 0 && <EmptyRoom />}
                {/* ROOMS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 m-1">
                    {rooms.map((room) => (
                        <div key={room.id} data-tour={`room-card-${room.id}`}>
                            <RoomCard
                                room={room}
                                isRefreshing={refreshingRoomId === room.id}
                                onRefresh={async () => {
                                    await handleRefreshRoom(room.id);
                                }}
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
