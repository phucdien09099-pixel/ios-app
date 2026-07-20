"use client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { apiClient } from "@/utils/Tauri/HttpClient";
import { ForgotPasswordOtp } from "./forgot-password-otp";

// Export type để 2 file sau dùng chung
export type ForgotPasswordEmailValues = {
  email: string;
};

export function ForgotPasswordForm() {
  const { open } = useNavDrawer();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordEmailValues>({
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordEmailValues) => {
    const email = data.email.trim().toLowerCase();
    try {
      await apiClient.post("/api/auth/password/forgot", { email }, { auth: false });

      open({
        id: "forgot-password-otp",
        title: "",
        component: ForgotPasswordOtp,
        props: { email },
      });
    } catch (error) {
      console.error("Lỗi khi gửi mã xác thực quên mật khẩu:", error);
      toast.error("Không thể gửi mã xác thực. Vui lòng kiểm tra lại email!");
    }
  };

  return (
    <div className="w-full flex flex-col pt-0 px-2">
      <div className="w-full text-center mb-4">
        <h2 className="text-2xl font-bold">Quên mật khẩu</h2>
        <p className="text-sm text-muted-foreground">
          Nhập địa chỉ email của bạn và chúng tôi sẽ gửi một email với xác nhận để đặt lại mật khẩu.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <FieldGroup className="space-y-6">
          <Field>
            <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
            <Input
              id="forgot-email"
              type="email"
              placeholder="m@example.com"
              {...register("email", {
                required: "Vui lòng nhập địa chỉ email",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
                  message: "Vui lòng nhập đúng định dạng email",
                },
              })}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </Field>

          <Field>
            <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl">
              {isSubmitting ? "Đang gửi..." : "Gửi mã"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
