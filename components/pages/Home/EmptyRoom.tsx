
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, } from "@/components/ui/empty"
import { MeetingRoomIcon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import AddRoom from "../AdditionalRoom";

export function EmptyRoom() {
    const { open } = useNavDrawer();

    return (
        <Empty className="min-h-[calc(100dvh-13rem)]">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <HugeiconsIcon icon={MeetingRoomIcon} />
                </EmptyMedia>
                <EmptyTitle>Chưa có khu vực được tạo</EmptyTitle>
                <EmptyDescription>
                    Bạn chưa tạo khu vực nào. Hãy bắt đầu bằng cách tạo
                    khu vực đầu tiên của bạn.
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
                <Button
                    onClick={() => open({
                        id: "addition_room",
                        title: "Thêm Khu Vực",
                        component: AddRoom,
                    })}>
                    <HugeiconsIcon data-icon="inline-start" icon={PlusSignIcon} />
                    Tạo khu vực
                </Button>
                {/* <Button variant="outline">Nhập khu vực</Button> */}
            </EmptyContent>
            {/* <Button variant="link" className="text-muted-foreground" size="sm" nativeButton={false} render={<a href="#">Tìm hiểu thêm</a>} /> */}
        </Empty>
    )
}
