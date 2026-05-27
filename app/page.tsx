"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/utils";
import { apiClient } from "@/utils/Tauri/HttpClient";
import { userSessionRepo } from "@/db/repository/UserSessionRepository";
import { userRepo } from "@/db/repository/UserRepository";
import { RoomPage } from "@/components/pages/Home";
import AuthSelectPage from "@/components/pages/auth";


type LoginFormValues = {
  email: string;
  password: string;
};

export default function page({ className, ...props }: React.ComponentProps<"div">) {
  const [serverError, setServerError] = React.useState("");

  // Trạng thái kiểm soát giao diện: "checking" (đang quét DB), "logged_out" (hiện login), "logged_in" (hiện RoomPage)
  const [appState, setAppState] = React.useState<"checking" | "logged_out" | "logged_in">("checking");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  // ================= 0. TỰ ĐỘNG ĐĂNG NHẬP KHI MỞ APP =================
  React.useEffect(() => {
    async function autoLogin() {
      try {
        // Gọi hàm lấy active user mới nhất từ SQLite (Hàm chúng ta vừa viết ở bước trước)
        const activeUser = await userSessionRepo.getLatestActiveUser();

        if (activeUser) {
          console.log("Tìm thấy phiên đăng nhập cũ hợp lệ:", activeUser);
          // Set lại token vào HttpClient cho các request sau
          await apiClient.setAccessToken(activeUser.access_token);
          // Cho phép vào thẳng RoomPage
          setAppState("logged_in");
        } else {
          // Không có session nào -> Hiện form đăng nhập
          setAppState("logged_out");
        }
      } catch (err) {
        console.error("Lỗi tự động đăng nhập:", err);
        setAppState("logged_out");
      }
    }
    autoLogin();
  }, []);

  // ================= HÀM XỬ LÝ ĐĂNG NHẬP THỦ CÔNG =================
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
        parentId: string | null;
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
        const existingUser = await userRepo.findByEmail(data.email);
        const isOwner = data.parentId === null || data.parentId === undefined || data.parentId === "";

        if (!existingUser) {
          await userRepo.create({
            id: data.id,
            email: data.email,
            name: data.name || "user",
            parent_id: data.parentId || null,
            is_owner: isOwner,
            created_at: new Date().toISOString(),
          });
          console.log(`Đã lưu User mới vào SQLite dưới dạng: ${isOwner ? "Owner" : "Member"}`);
        } else {
          await userRepo.update(data.id as any, {
            name: data.name || "user",
            parent_id: data.parentId || null,
            is_owner: isOwner,
          });
          console.log("Đã cập nhật thông tin User trong SQLite.");
        }

        // Thao tác trên bảng `user_sessions`
        await userSessionRepo.deleteByUserId(data.id);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Hết hạn sau 7 ngày

        await userSessionRepo.createSession({
          user_id: data.id,
          access_token: data.token,
          refresh_token: data.refreshToken,
          device_name: "Desktop App",
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        });

        console.log("Đã đồng bộ Session thành công.");
      } catch (dbError) {
        console.error("Lỗi trong quá trình thao tác SQLite:", dbError);
      }

      // ================= 4. CHUYỂN GIAO DIỆN SANG ROOM PAGE =================
      setAppState("logged_in");

    } catch (error: any) {
      console.error(error);
      setServerError(error?.message || "Login failed");
    }
  }

  // Giao diện hiển thị theo từng trạng thái ứng dụng
  if (appState === "checking") {
    return <div className="flex h-screen items-center justify-center text-sm">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (appState === "logged_in") {
    return <RoomPage />;
  }

  return <AuthSelectPage onLoginSuccess={() => setAppState("logged_in")} />;
}
