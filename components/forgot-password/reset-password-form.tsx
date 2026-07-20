"use client";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, Circle } from "lucide-react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { apiClient } from "@/utils/Tauri/HttpClient";

interface ResetPasswordFormProps {
  email: string;
  otp: string;
  onSuccessCallback?: () => void;
}

type ResetPasswordValues = {
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

export function ResetPasswordForm({ email, otp, onSuccessCallback }: ResetPasswordFormProps) {
  const { closeAll } = useNavDrawer();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const newPassword = useWatch({ control, name: "newPassword" }) || "";
  const confirmPassword =
  useWatch({ control, name: "confirmPassword" }) || "";

  const hasMinLength = newPassword.length >= 8;
  const passwordsMatch =
  confirmPassword.length > 0 &&
  newPassword === confirmPassword;

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      await apiClient.post("/api/auth/password/reset", {
        email,
        otp,
        password: values.newPassword,
      }, { auth: false });

      toast.success("Đổi mật khẩu thành công! 🎉");
      closeAll();
      if (onSuccessCallback) onSuccessCallback();
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("400")) {
        toast.error("Mã xác thực không đúng hoặc đã hết hạn. Vui lòng thử lại từ đầu!");
      } else {
        toast.error("Không thể đổi mật khẩu. Vui lòng thử lại!");
      }
    }
  };

  return (
    <div className="w-full flex flex-col pt-0 px-2">
      <div className="w-full text-center mb-6">
        <h2 className="text-2xl font-bold">Đặt lại mật khẩu</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <FieldGroup className="space-y-3">
          <Field>
            <FieldLabel
              htmlFor="new-password"
              className="text-sm font-medium"
            >
              Mật khẩu mới
            </FieldLabel>
            <Input
              id="new-password"
              type="password"
              {...register("newPassword", {
                required: "Vui lòng nhập mật khẩu mới",
                minLength: { value: 8, message: "Must be at least 8 characters" },
              })}
            />
            {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword.message}</p>}
          </Field>

          <Field>
            <FieldLabel
              htmlFor="confirm-new-password"
              className="text-sm font-medium"
            >
              Xác nhận mật khẩu mới
            </FieldLabel>
            <Input
              id="confirm-new-password"
              type="password"
              {...register("confirmPassword", {
                required: "Vui lòng xác nhận mật khẩu mới",
                validate: (value) => value === newPassword || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
          </Field>

          <div className="flex flex-col gap-1.5 pt-0">
          <ChecklistItem
            passed={hasMinLength}
            label="Mật khẩu ít nhất 8 ký tự"
          />

          <ChecklistItem
            passed={passwordsMatch}
            label="Hai mật khẩu khớp nhau"
          />
        </div>

          <Field className="pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl">
              {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
