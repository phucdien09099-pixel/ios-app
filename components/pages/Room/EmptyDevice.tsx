"use client"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, } from "@/components/ui/empty"
import { MeetingRoomIcon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import AddDeviceForm from "../AdditionalDevice";
import HelpButton from "@/components/common/HelpButton";
import { startAddDeviceTour } from "@/components/onboarding/tours/addDeviceTour";

export function EmptyDevices({ roomId, roomName }: { roomName: string, roomId: string }) {
    const { open } = useNavDrawer();

    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <HugeiconsIcon icon={MeetingRoomIcon} />
                </EmptyMedia>
                <EmptyTitle>Thiết bị chưa được khởi tạo</EmptyTitle>
                <EmptyDescription>
                    Bạn chưa có thiết bị nào. Hãy bắt đầu bằng cách tạo
                    thiết bị đầu tiên của bạn.
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
                <Button
                    onClick={() => open({
                        id: "addition_device",
                        title: "Thêm thiết bị",
                        
                        // 🟢 ĐÃ SỬA CHỖ NÀY THÀNH HELP BUTTON
                        renderRightButtonHeader: <HelpButton onClick={() => startAddDeviceTour(true)} />,
                        
                        props: {
                            roomId: roomId,
                            roomName: roomName
                        },
                        component: AddDeviceForm,
                    })}>
                    <HugeiconsIcon icon={PlusSignIcon} />
                    Tạo thiết bị
                </Button>
            </EmptyContent>
        </Empty>
    )
}