"use client";

import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, Circle } from "lucide-react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { apiClient } from "@/utils/Tauri/HttpClient";
import ChangePasswordOtp from "./ChangePasswordOtp";

type ChangePasswordValues = {
  newPassword: string;
  confirmPassword: string;
};

function ChecklistItem({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${passed ? "text-green-600" : "text-muted-foreground"}`}>
      {passed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      {label}
    </div>
  );
}

export default function ChangePasswordForm() {
  const { open } = useNavDrawer();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const newPassword = useWatch({ control, name: "newPassword" }) || "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) || "";

  const hasMinLength = newPassword.length >= 8;

  const onSubmit = async (values: ChangePasswordValues) => {
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const email = user?.email;

      if (!email) {
        toast.error("Không xác định được email tài khoản. Vui lòng đăng nhập lại!");
        return;
      }

      // TODO: xác nhận lại chính xác full path với backend (chưa thấy @RequestMapping prefix)
      // Không truyền { auth: false } - cần Bearer token, apiClient tự gắn
      await apiClient.post("/api/auth/password/change/otp/request", {
        email,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      open({
        id: "change-password-otp",
        title: "",
        component: ChangePasswordOtp,
        props: {
          email,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        },
      });
    } catch (error) {
      console.error("Lỗi khi gửi mã xác thực đổi mật khẩu:", error);
      toast.error("Mật khẩu mới không được trùng với mật khẩu hiện tại");
    }
  };

  return (
    <div className="w-full flex flex-col pt-0 px-2">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <FieldGroup className="space-y-4">
          <Field>
            <FieldLabel htmlFor="new-password">Mật khẩu mới</FieldLabel>
            <Input
              id="new-password"
              type="password"
              {...register("newPassword", {
                required: "Vui lòng nhập mật khẩu mới",
                minLength: { value: 8, message: "Phải có ít nhất 8 ký tự" },
              })}
            />
            {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword.message}</p>}
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-new-password">Nhập lại mật khẩu mới</FieldLabel>
            <Input
              id="confirm-new-password"
              type="password"
              {...register("confirmPassword", {
                required: "Vui lòng xác nhận mật khẩu mới",
                validate: (value) => value === newPassword || "Mật khẩu xác nhận không khớp",
              })}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </Field>

          <div className="flex flex-col gap-1.5 pt-1">
            <ChecklistItem passed={hasMinLength} label="Ít nhất 8 ký tự" />
            <ChecklistItem
              passed={newPassword.length > 0 && newPassword === confirmPassword}
              label="Mật khẩu trùng khớp"
            />
          </div>

          <Field className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl">
              {isSubmitting ? "Đang gửi..." : "Tiếp theo"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
