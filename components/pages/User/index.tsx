import { Card, CardContent, } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage, } from "@/components/ui/avatar"
import { ArrowRight01Icon, CustomerService01Icon, Message01Icon, UserGroupIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import MemberList from "./MemberList"
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer"
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"; 
import { Logout01Icon } from "@hugeicons/core-free-icons"; 
import { userSessionRepo } from "@/db/repository/UserSessionRepository";

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
    const { open, back } = useNavDrawer();
    const [userData, setUserData] = useState<{name: string, email: string, is_owner?: boolean} | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUserData(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = async () => {
    try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            
            // 1. GỌI XUỐNG SQLITE: Xóa phiên đăng nhập yên tâm chạy ngầm
            await userSessionRepo.deleteByUserId(parsed.id);
            
            // 2. GHI NHỚ: Lưu lại thông tin user vào mục riêng để trang login đọc được
            localStorage.setItem("remembered_user", storedUser);
        }
    } catch (error) {
        console.error("Lỗi khi xóa session trong DB:", error);
    }

    // 3. Xóa token phiên làm việc hiện tại dưới localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("refresh_token");

    // Thêm dòng này để ĐÓNG cái Drawer (màn hình đè) đi:
    back(); 

    // 4. CHUẨN HOÁ: Phát sự kiện báo hiệu đăng xuất toàn cục
    window.dispatchEvent(new Event("app-logout"));
};

    return (
        // THAY ĐỔI LỚN Ở ĐÂY: Thêm h-full, overflow-y-auto để cuộn, và pb-24 để không bị lấp nút
        <div className="h-full overflow-y-auto bg-muted/30 pb-24 px-4 pt-4">
            <div className="mx-auto max-w-md space-y-6">
                
                <Card className="ring-0!">
                    <CardContent className="flex flex-col items-center py-8">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                            <AvatarImage src="/avatar.png" />
                            <AvatarFallback>
                                {userData?.name?.charAt(0).toUpperCase() || userData?.email?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="mt-4 text-center">
                            <h2 className="text-xl font-semibold tracking-tight">
                                {userData ? userData.name : "Đang tải..."}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {userData ? userData.email : ""}
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

                {/* NÚT ĐĂNG XUẤT TO ĐƯỢC ĐƯA TRỞ LẠI RA NGOÀI */}
                <Button 
                    variant="destructive" 
                    className="w-full h-14 rounded-2xl text-base font-medium shadow-sm hover:shadow-md transition-all mt-4"
                    onClick={handleLogout}
                >
                    <HugeiconsIcon icon={Logout01Icon} className="mr-3 h-5 w-5" />
                    Đăng xuất
                </Button>

            </div>
        </div>
    )
}