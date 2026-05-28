"use client"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, } from "@/components/ui/empty"
import { MeetingRoomIcon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import AddDeviceForm from "../AdditionalDevice";

export function EmptyDevices({ roomId }: { roomId: string }) {
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
                        element: <AddDeviceForm roomId={roomId} />,
                    })}><HugeiconsIcon icon={PlusSignIcon} />Tạo thiết bị</Button>
                {/* <Button variant="outline">Nhập khu vực</Button> */}
            </EmptyContent>
            {/* <Button variant="link" className="text-muted-foreground" size="sm" nativeButton={false} render={<a href="#">Tìm hiểu thêm</a>} /> */}
        </Empty>
    )
}
