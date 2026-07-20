"use client";

import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  UserIcon,
  LockPasswordIcon,
} from "@hugeicons/core-free-icons";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import InformationForm from "./InformationForm";
import ChangePasswordForm from "./ChangePasswordForm";

const settingsMenus = [
  {
    id: "account-info",
    icon: UserIcon,
    title: "Thông tin tài khoản",
    description: "Tên và email đăng ký",
    component: InformationForm,
  },
  {
    id: "change-password",
    icon: LockPasswordIcon,
    title: "Đổi mật khẩu",
    description: "Cập nhật mật khẩu đăng nhập",
    component: ChangePasswordForm,
  },
];

export default function SettingsPage() {
  const { open } = useNavDrawer();

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="mx-auto max-w-md space-y-6">
        {/* Danh sách cài đặt - flatten trực tiếp, không qua trang trung gian */}
        <Card className="ring-0!">
          <CardContent className="p-0">
            {settingsMenus.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() =>
                    open({
                      id: item.id,
                      title: item.title,
                      component: item.component,
                    })
                  }
                  className="flex w-full items-center justify-between px-5 py-4 transition-all hover:bg-muted/50 active:scale-[0.995]"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-primary/10 p-2.5">
                      <HugeiconsIcon icon={Icon} />
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>

                  <HugeiconsIcon icon={ArrowRight01Icon} />
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
