
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, } from "@/components/ui/empty"
import { Back, MeetingRoomIcon } from "@hugeicons/core-free-icons"
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"

export function UpCommingFeature() {
    const { back } = useNavDrawer();

    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <HugeiconsIcon icon={MeetingRoomIcon} />
                </EmptyMedia>
                <EmptyTitle>NOT FOUND</EmptyTitle>
                <EmptyDescription>
                    Tính năng hiện đang phát triển hoặc không có,
                    vui long thử lại sau
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
                <Button onClick={back}><HugeiconsIcon icon={Back} />Trở về</Button>
            </EmptyContent>
        </Empty>
    )
}
