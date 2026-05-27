"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel, } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/utils";
import { apiClient } from "@/utils/Tauri/HttpClient";
import { userSessionRepo } from "@/db/repository/UserSessionRepository";
import { userRepo } from "@/db/repository/UserRepository";
import { RoomPage } from "./pages/Home";

type LoginFormValues = {
  email: string;
  password: string;
};

interface LoginFormProps extends React.ComponentProps<"div"> {
  onSuccess?: () => void; // Khai báo prop nhận từ bên ngoài
}

export function LoginForm({ className, onSuccess, ...props }: LoginFormProps) {

  const router = useRouter();

  const [serverError, setServerError] =
    React.useState("");

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });


  // ... bên trong component LoginForm ...

  async function onSubmit(values: LoginFormValues) {
    try {
      setServerError("");

      // ================= 1. GỌI API ĐĂNG NHẬP BÊN THỨ 3 =================
      const data = await apiClient.post<{
        token: string;
        refreshToken: string;
        id: string;
        email: string;
        name: string;
        parentId: string | null; // Lấy thêm trường parentId từ API trả về
      }>("/api/v1/auth/login", values);

      // ================= 2. LƯU TOKEN VÀO STATE / LOCALSTORAGE =================
      await apiClient.setAccessToken(data.token);
      localStorage.setItem("refresh_token", data.refreshToken);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          email: data.email,
          name: data.name,
          parentId: data.parentId,
        })
      );

      // ================= 3. ĐỒNG BỘ DỮ LIỆU XUỐNG SQLITE LOCAL =================
      try {
        // Kiểm tra xem User này đã từng tồn tại dưới local chưa
        const existingUser = await userRepo.findByEmail(data.email);

        // TỰ ĐỘNG XÁC ĐỊNH OWNER HOẶC MEMBER DỰA VÀO PARENT_ID
        // Nếu không có parentId thì là Owner (true), ngược lại có parentId thì là Member (false)
        const isOwner = data.parentId === null || data.parentId === undefined || data.parentId === "";

        if (!existingUser) {
          // Sử dụng hàm create gốc của SQLiteBase để tự định nghĩa các cờ theo logic parent_id
          await userRepo.create({
            id: data.id,
            email: data.email,
            name: "user",
            parent_id: data.parentId || null,
            is_owner: isOwner, // true nếu là Owner, false nếu là Member
            created_at: new Date().toISOString(),
          });
          console.log(`Đã lưu User mới vào SQLite dưới dạng: ${isOwner ? "Owner" : "Member"}`);
        } else {
          // Nếu đã tồn tại, cập nhật lại thông tin bao gồm cả việc thay đổi parent/owner (nếu có)
          await userRepo.update(data.id as any, {
            name: "user",
            parent_id: data.parentId || null,
            is_owner: isOwner,
            // updated_at: new Date().toISOString(),
          });
          console.log("Đã cập nhật thông tin User trong SQLite.");
        }

        // --- Thao tác trên bảng `user_sessions` ---
        await userSessionRepo.deleteByUserId(data.id);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await userSessionRepo.createSession({
          user_id: data.id,
          access_token: data.token,
          refresh_token: data.refreshToken,
          device_name: "Desktop App",
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        });

        console.log("Đã đồng bộ Session thành công.");
        if (onSuccess) {
          onSuccess();
        }
      } catch (dbError) {
        console.error("Lỗi trong quá trình thao tác SQLite:", dbError);
      }

      // ================= 4. ĐIỀU HƯỚNG VỀ TRANG CHỦ =================
      console.log(data);

      return <RoomPage />;
    } catch (error: any) {
      console.error(error);
      setServerError(error?.message || "Login failed");
    }
  }
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        className
      )}
      {...props}
    >
      <Card className="w-full ring-0 focus-visible:ring-0">

        <CardHeader>

          <CardTitle>
            Login to your account
          </CardTitle>

          <CardDescription>
            Enter your email below
            to login to your account
          </CardDescription>

        </CardHeader>

        <CardContent>

          <form
            onSubmit={handleSubmit(
              onSubmit
            )}
          >

            <FieldGroup>

              {/* EMAIL */}

              <Field>

                <FieldLabel htmlFor="email">
                  Email
                </FieldLabel>

                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register(
                    "email",
                    {
                      required:
                        "Email is required",
                    }
                  )}
                />

                {errors.email && (
                  <FieldError>
                    {
                      errors.email
                        .message
                    }
                  </FieldError>
                )}

              </Field>

              {/* PASSWORD */}

              <Field>

                <div className="flex items-center">

                  <FieldLabel htmlFor="password">
                    Password
                  </FieldLabel>

                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>

                </div>

                <Input
                  id="password"
                  type="password"
                  {...register(
                    "password",
                    {
                      required:
                        "Password is required",
                    }
                  )}
                />

                {errors.password && (
                  <FieldError>
                    {
                      errors.password
                        .message
                    }
                  </FieldError>
                )}

              </Field>

              {/* SERVER ERROR */}

              {serverError && (
                <p className="text-sm text-red-500">
                  {serverError}
                </p>
              )}

              {/* SUBMIT */}

              <Field>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting
                    ? "Logging in..."
                    : "Login"}
                </Button>

              </Field>

            </FieldGroup>

          </form>

        </CardContent>

      </Card>
    </div>
  );
}
