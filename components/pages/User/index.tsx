import { Card, CardContent, } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage, } from "@/components/ui/avatar"
import { ArrowRight01Icon, CustomerService01Icon, Message01Icon, UserGroupIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import MemberList from "./MemberList"
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer"

const menus = [
    {
        title: "Quản lý người dùng",
        icon: UserGroupIcon,
        element: MemberList,
    },
    {
        title: "Trung tâm tin nhắn",
        icon: Message01Icon,
        element: () => null
    },
    {
        title: "Câu hỏi thường gặp và phản hồi",
        icon: CustomerService01Icon,
        element: () => null
    },
]

export default function UserPage() {
    const { open } = useNavDrawer();
    return (
        <div className="min-h-[90vh] bg-muted/30">
            <div className="mx-auto max-w-md space-y-6">
                <Card className="ring-0!">
                    <CardContent className="flex flex-col items-center py-8">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                            <AvatarImage src="/avatar.png" />
                            <AvatarFallback>HN</AvatarFallback>
                        </Avatar>
                        <div className="mt-4 text-center">
                            <h2 className="text-xl font-semibold tracking-tight">
                                Han Nguyen
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Thành viên hệ thống
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Menu */}
                <Card className="ring-0!">
                    <CardContent className="p-0">
                        {menus.map((item, index) => {
                            const Icon = item.icon
                            return (
                                <button key={item.title}
                                    onClick={() => open({
                                        id: item.title,
                                        title: item.title,
                                        component: item.element,
                                    })}
                                    className={`flex w-full items-center justify-between px-5 py-4 transition-all hover:bg-muted/50 active:scale-[0.995]`}>
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-2xl bg-primary/10 p-2.5">
                                            <HugeiconsIcon icon={Icon} />
                                        </div>

                                        <span className="text-sm font-medium">
                                            {item.title}
                                        </span>
                                    </div>
                                    <HugeiconsIcon icon={ArrowRight01Icon} />
                                </button>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
