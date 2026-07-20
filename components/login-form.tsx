"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/utils";
import { apiClient } from "@/utils/Tauri/HttpClient";
import { userSessionRepo } from "@/db/repository/UserSessionRepository";
import { userRepo } from "@/db/repository/UserRepository";
import { registerDeviceFcmToken } from "@/libs/fcmClient";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { ForgotPasswordForm } from "@/components/forgot-password/forgot-password-form";

type LoginFormValues = {
  email: string;
  password: string;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
  account: {
    id: number;
    email: string;
    status: string;
    roles: string[];
  };
};

interface LoginFormProps extends React.ComponentProps<"div"> {
  onSuccess?: () => void;
}

export function LoginForm({ className, onSuccess, ...props }: LoginFormProps) {
  const [serverError, setServerError] = React.useState("");
  const { open } = useNavDrawer();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  React.useEffect(() => {
    const remembered = localStorage.getItem("remembered_user");
    if (remembered) {
      const parsed = JSON.parse(remembered);
      if (parsed.email) {
        setValue("email", parsed.email);
      }
    }
  }, [setValue]);

  async function onSubmit(values: LoginFormValues) {
    try {
      setServerError("");

      const data = await apiClient.post<AuthResponse>("/api/auth/login", values, { auth: false });
      const accountId = String(data.account.id);
      const displayName = data.account.email.split("@")[0];

      await apiClient.setAuthSession(data);
      localStorage.setItem("auth_password", values.password);

      try {
        await registerDeviceFcmToken();
      } catch (fcmError) {
        console.warn("Không thể đăng ký FCM token sau khi đăng nhập:", fcmError);
      }

      try {
        const existingUser = await userRepo.findByEmail(data.account.email);
        const userId = existingUser?.id ?? accountId;

        localStorage.setItem(
          "user",
          JSON.stringify({
            id: userId,
            accountId,
            email: data.account.email,
            name: existingUser?.name || displayName,
            parentId: null,
            roles: data.account.roles,
          })
        );

        if (!existingUser) {
          await userRepo.create({
            id: userId,
            email: data.account.email,
            name: displayName,
            parent_id: null,
            is_owner: true,
            role: "owner",
            created_at: new Date().toISOString(),
          });
        }

        await userSessionRepo.deleteByUserId(userId);

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + data.refreshExpiresInSeconds);

        await userSessionRepo.createSession({
          id: crypto.randomUUID(),
          user_id: userId,
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
          device_name: "Desktop App",
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        });

        if (onSuccess) {
          onSuccess();
        }
      } catch (dbError) {
        console.error("Lỗi trong quá trình thao tác SQLite:", dbError);
      }
    } catch (error: unknown) {
      console.error("Lỗi gốc từ hệ thống:", error);
      const rawError = error instanceof Error ? error.message : String(error);
      let friendlyError = "Đã xảy ra lỗi, vui lòng thử lại!";

      if (rawError.includes("401") || rawError.includes("Unauthorized")) {
        friendlyError = "Email hoặc mật khẩu không đúng!";
      } else if (rawError.includes("404") || rawError.includes("Not Found")) {
        friendlyError = "Email chưa được đăng ký hệ thống!";
      } else if (rawError.includes("network") || rawError.includes("Failed to fetch")) {
        friendlyError = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!";
      }

      setServerError(friendlyError);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto p-4 sm:p-0", className)} {...props}>
      <div className={cn("flex flex-col gap-6 w-full h-full max-w-md mx-auto p-4 sm:p-0 justify-center", className)} {...props}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">Đăng nhập</CardTitle>
        <CardDescription>Nhập email và mật khẩu của bạn để đăng nhập vào tài khoản</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="space-y-1">
            <Field className="flex flex-col gap-1.5 w-full">
              <FieldLabel htmlFor="email" className="text-sm font-medium">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                className="w-full rounded-xl h-10"
                {...register("email", { required: "Vui lòng nhập địa chỉ email" })}
              />
              {errors.email && <FieldError className="text-xs text-red-500">{errors.email.message}</FieldError>}
            </Field>

            <Field className="flex flex-col gap-1 w-full">
            {/* Nhãn Mật khẩu giữ nguyên phía trên */}
            <FieldLabel htmlFor="password" className="text-sm font-medium">Mật khẩu</FieldLabel>
            
            <Input
              id="password"
              type="password"
              className="w-full rounded-xl h-10"
              {...register("password", { required: "Vui lòng nhập mật khẩu" })}
            />
            
            {/* Phần hiển thị lỗi và link quên mật khẩu nằm bên dưới Input */}
            <div className="flex items-center justify-between w-full text-xs mt-1">
              {errors.password ? (
                <FieldError className="text-red-500">{errors.password.message}</FieldError>
              ) : (
                <div /> /* Thẻ trống để giữ khoảng trống đẩy link quên mật khẩu sang phải khi không có lỗi */
              )}
              
              <a href="#"
                onClick={(e) => {
                  e.preventDefault();
                  open({
                    id: "forgot-password",
                    title: "",
                    component: ForgotPasswordForm,
                  });
                }}
                className="text-blue-600 underline-offset-4 hover:underline transition-colors ml-auto"
              >
                Quên mật khẩu?
              </a>
            </div>
          </Field>


            {serverError && (
              <p className="text-sm font-medium text-red-500 bg-red-50/50 p-2.5 rounded-xl border border-red-100 text-center animate-in fade-in-50 duration-200">
                {serverError}
              </p>
            )}

            <Field className="pt-2 w-full">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-10 font-medium transition-all">
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      </div>
    </div>
  );
}
