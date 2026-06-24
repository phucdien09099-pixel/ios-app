"use client";
import { useEffect } from "react";
import { userRepo } from "@/db/repository/UserRepository";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer"; 
import { apiClient } from "@/utils/Tauri/HttpClient"; 
import { toast } from "sonner"; // ✨ Import thư viện Toast siêu đẹp

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, useWatch } from "react-hook-form";
import { TimezoneCombobox } from "@/components/timezone-combobox"; 

type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone: string;
};

type AccountResponse = {
  id: number;
  email: string;
  status: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
};

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const { back } = useNavDrawer(); 
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

  // TỰ ĐỘNG NHẬN DIỆN MÚI GIỜ HỆ THỐNG
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

  const onSubmit = async (data: FormValues) => {
    try {
      const account = await apiClient.post<AccountResponse>("/api/auth/register", {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      const existingUser = await userRepo.findByEmail(account.email);
      if (!existingUser) {
        await userRepo.create({
          id: String(account.id),
          name: data.name,
          email: account.email,
          role: "owner",
          parent_id: null,
          is_owner: true,
          timezone: data.timezone,
          created_at: account.createdAt,
        });
      }

      // 4. THÔNG BÁO VÀ CHUYỂN HƯỚNG
      toast.success("Tạo tài khoản thành công! 🎉"); // ✨ Đổi sang Toast
      back(); // Quay lại trang trước an toàn

    } catch (error) {
      console.error("Lỗi khi tạo tài khoản:", error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("409") || message.includes("already exists")) {
        toast.error("Email này đã được đăng ký!");
      } else if (message.includes("400")) {
        toast.error("Email hoặc mật khẩu không hợp lệ.");
      } else {
        toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại!");
      }
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register("name", { required: "Name is required" })}
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
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Must be at least 8 characters",
                  },
                })}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => value === password || "Passwords do not match",
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
                {isSubmitting ? "Creating..." : "Create Account"}
              </Button>
            </Field>

          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
