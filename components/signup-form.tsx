"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, useWatch } from "react-hook-form";
import { TimezoneCombobox } from "@/components/timezone-combobox";
import { OtpForm } from "./otp-form";
import { apiClient } from "@/utils/Tauri/HttpClient";

// Export type này để file OTP có thể dùng chung
export type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone: string;
};

// Đã fix lỗi "Unknown event handler property onSuccess" ở đây
interface SignupFormProps extends React.ComponentProps<typeof Card> {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess, ...props }: SignupFormProps) {
  const { open } = useNavDrawer();
  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      timezone: "",
    }
  });

  const password = useWatch({ control, name: "password" });
  const timezone = useWatch({ control, name: "timezone" });

  useEffect(() => {
    try {
      let tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === "Etc/GMT-7" || tz === "GMT-7" || tz === "Asia/Saigon") {
        tz = "Asia/Ho_Chi_Minh";
      }
      setValue("timezone", tz);
    } catch {
      setValue("timezone", "Asia/Ho_Chi_Minh");
    }
  }, [setValue]);

  // Giờ hàm này gọi API xin OTP trước, gửi mã xong mới đẩy DATA sang OTP Form
  const onSubmit = async (data: FormValues) => {
    try {
      await apiClient.post(
        "/api/auth/otp/request",
        { email: data.email.trim().toLowerCase() },
        { auth: false }
      );

      open({
        id: "otp-verify",
        title: "",
        component: OtpForm,
        props: {
          signupData: data, // Ném nguyên cục dữ liệu sang đây
          onSuccessCallback: onSuccess // Truyền onSuccess theo nếu có
        }
      });
    } catch (error) {
      console.error("Lỗi khi gửi mã OTP:", error);
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("409") || message.includes("already exists")) {
        toast.error("Email này đã được đăng ký!");
      } else {
        toast.error("Không thể gửi mã xác thực. Vui lòng thử lại!");
      }
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Tạo tài khoản</CardTitle>
        <CardDescription>
          Nhập thông tin của bạn bên dưới để tạo tài khoản
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Họ và tên</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register("name", { required: "Vui lòng nhập họ và tên" })}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email", {
                  required: "Vui lòng nhập địa chỉ email",
                  pattern: {
                    value: /^[^\s@]+@gmail\.com$/i,
                    message: "Vui lòng nhập đúng định dạng đuôi @gmail.com",
                  },
                })}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
              <Input
                id="password"
                type="password"
                {...register("password", {
                  required: "Vui lòng nhập mật khẩu",
                  minLength: {
                    value: 8,
                    message: "Mật khẩu phải có ít nhất 8 ký tự",
                  },
                })}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">Xác nhận Mật khẩu</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                {...register("confirmPassword", {
                  required: "Vui lòng xác nhận mật khẩu",
                  validate: (value) => value === password || "Mật khẩu không khớp",
                })}
              />
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </Field>

            <Field>
              <FieldLabel>Khu vực nhà (Múi giờ)</FieldLabel>
              <TimezoneCombobox
                value={timezone}
                onChange={(val) => setValue("timezone", val)}
              />
            </Field>

            <Field>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                Xác thực tài khoản
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
