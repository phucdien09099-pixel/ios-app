"use client";
import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { userRepo } from "@/db/repository/UserRepository";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer"; 
import { apiClient } from "@/utils/Tauri/HttpClient"; 
import { toast } from "sonner"; // ✨ Import thư viện Toast siêu đẹp

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { TimezoneCombobox } from "@/components/timezone-combobox"; 

type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  timezone: string;
};

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const { back } = useNavDrawer(); 
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      timezone: "", 
    }
  });

  const password = watch("password");

  // TỰ ĐỘNG NHẬN DIỆN MÚI GIỜ HỆ THỐNG
  useEffect(() => {
    try {
      let tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === "Etc/GMT-7" || tz === "GMT-7" || tz === "Asia/Saigon") {
        tz = "Asia/Ho_Chi_Minh";
      }
      setValue("timezone", tz);
    } catch (e) {
      setValue("timezone", "Asia/Ho_Chi_Minh");
    }
  }, [setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      // 1. KIỂM TRA TRÙNG EMAIL
      const existingUser = await userRepo.findByEmail(data.email);
      if (existingUser) {
        toast.error("Email này đã được đăng ký. Vui lòng dùng email khác!"); // ✨ Đổi sang Toast
        return; 
      }

      // 2. GỌI SERVER
      try {
        await apiClient.post("/api/v1/auth/signup", {
          name: data.name,
          email: data.email,
          password: data.password,
          // timezone: data.timezone, 
        });
      } catch (serverErr) {
        console.warn("Chưa gọi được lên Server hoặc API chưa đúng:", serverErr);
      }

      // 3. LƯU VÀO SQLITE
      const newUserId = uuid();
      await userRepo.create({
        id: newUserId,
        name: data.name,
        email: data.email,
        password: data.password,
        role: "user",
        parent_id: null,
        timezone: data.timezone,
        created_at: new Date().toISOString(),
      });

      // 4. THÔNG BÁO VÀ CHUYỂN HƯỚNG
      toast.success("Tạo tài khoản thành công! 🎉"); // ✨ Đổi sang Toast
      back(); // Quay lại trang trước an toàn

    } catch (error) {
      console.error("Lỗi khi lưu DB:", error);
      toast.error("Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại!"); // ✨ Đổi sang Toast
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
                value={watch("timezone")}
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