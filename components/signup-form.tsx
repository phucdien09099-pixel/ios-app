"use client";
import { useState } from "react";
import { v4 as uuid } from "uuid";
import { userRepo } from "@/db/repository/UserRepository";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer"; // Import để đóng drawer
import { apiClient } from "@/utils/Tauri/HttpClient"; // Import để gọi Server

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const { back } = useNavDrawer(); // Hook để điều khiển rèm
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>();

  const password = watch("password");

  const onSubmit = async (data: FormValues) => {
    try {
      // 1. KIỂM TRA TRÙNG EMAIL TRONG SQLITE (Local)
      const existingUser = await userRepo.findByEmail(data.email);
      if (existingUser) {
        window.alert("Email này đã được đăng ký. Vui lòng dùng email khác!");
        return; // Dừng lại, popup tắt, người dùng ở lại form
      }

      // 2. GỌI LÊN SERVER ĐỂ ĐĂNG KÝ (ĐỂ ĐĂNG NHẬP KHÔNG BỊ LỖI)
      // LƯU Ý: Đổi "/api/v1/auth/signup" thành đúng đường dẫn API đăng ký của backend bạn
      // Nếu chưa có API backend, hãy comment lại đoạn này
      try {
        await apiClient.post("/api/v1/auth/signup", {
          name: data.name,
          email: data.email,
          password: data.password,
        });
      } catch (serverErr) {
        console.warn("Chưa gọi được lên Server hoặc API chưa đúng:", serverErr);
        // Tạm thời vẫn cho lưu SQLite để bạn test offline
      }

      // 3. LƯU VÀO DATABASE LOCAL (SQLite)
      const newUserId = uuid();
      await userRepo.create({
        id: newUserId,
        name: data.name,
        email: data.email,
        password: data.password,
        role: "user",
        parent_id: null,
        created_at: new Date().toISOString(),
      });

      // 4. HIỂN THỊ POPUP THÀNH CÔNG VÀ QUAY VỀ
      window.alert("Tạo tài khoản thành công!");
      back(); // Nhấn OK sẽ tự động lùi về màn hình có nút Đăng nhập

    } catch (error) {
      console.error("Lỗi khi lưu DB:", error);
      window.alert("Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại!");
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