"use client";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Login03Icon, UserAdd01Icon, SmartPhone01Icon, } from "@hugeicons/core-free-icons";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";

interface AuthSelectPageProps {
    onLoginSuccess: () => void;
}

export default function AuthSelectPage({ onLoginSuccess }: AuthSelectPageProps) {
    const { open, back } = useNavDrawer();

    return (
        <main className="flex flex-col min-h-dvh items-center justify-center bg-muted/30 p-4">
            <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
                    <HugeiconsIcon
                        icon={SmartPhone01Icon}
                        size={42}
                        className="text-primary" />
                </div>

                <h1 className="text-2xl font-bold tracking-tight">
                    Smart Home
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                    Điều khiển và quản lý thiết bị của bạn mọi lúc mọi nơi
                </p>
            </div>

            <div className="mt-8 space-y-3">
                <Button
                    onClick={() => open({
                        id: "login",
                        title: "",
                        component: LoginForm,
                        props: {
                            onSccess: () => { back(); onLoginSuccess() },
                            className: "h-[70vh]"
                        },
                        renderRightButtonHeader: <></>,
                    })}
                    className="h-12 w-full rounded-2xl text-base"
                    size="lg">
                    <HugeiconsIcon
                        icon={Login03Icon}
                        size={20}
                        className="mr-2" />
                    Đăng nhập
                </Button>

                <Button onClick={() => open({
                    id: "signup",
                    title: "",
                    component: SignupForm,
                    props: {
                        className: "ring-0! h-[70vh]"
                    },
                    renderRightButtonHeader: <></>,
                })}
                    variant="outline"
                    className="h-12 w-full rounded-2xl text-base"
                    size="lg">
                    <HugeiconsIcon
                        icon={UserAdd01Icon}
                        size={20}
                        className="mr-2" />
                    Tạo tài khoản
                </Button>
            </div>
        </main>
    );
}
