"use client";

import * as React from "react";
import { apiClient } from "@/utils/Tauri/HttpClient";
import { userSessionRepo } from "@/db/repository/UserSessionRepository";
import { RoomPage } from "@/components/pages/Home";
import AuthSelectPage from "@/components/pages/auth";

export default function EntryPointPage() {
  // Trạng thái kiểm soát giao diện: 
  // "checking" (đang quét DB), "logged_out" (về màn hình login), "logged_in" (vào thẳng trang chủ)
  const [appState, setAppState] = React.useState<"checking" | "logged_out" | "logged_in">("checking");

  // ================= TỰ ĐỘNG ĐĂNG NHẬP KHI MỞ APP =================
  React.useEffect(() => {
    async function autoLogin() {
      try {
        // Lấy phiên đăng nhập active mới nhất từ SQLite
        const activeUser = await userSessionRepo.getLatestActiveUser();

        if (activeUser) {
          console.log("Tìm thấy phiên đăng nhập cũ hợp lệ:", activeUser);
          // Cấu hình lại token vào HttpClient cho các request chạy ngầm sau đó
          await apiClient.setAccessToken(activeUser.access_token);
          // Cho phép vào thẳng trang chủ RoomPage
          setAppState("logged_in");
        } else {
          // Không có session nào tồn tại hoặc vừa bấm Đăng xuất -> Hiện màn hình login
          setAppState("logged_out");
        }
      } catch (err) {
        console.error("Lỗi tự động đăng nhập:", err);
        setAppState("logged_out");
      }
    }
    autoLogin();
  }, []);
  React.useEffect(() => {
    const handleGlobalLogout = () => {
      console.log("Hệ thống nhận tín hiệu Đăng xuất -> Chuyển về màn hình Login ngay lập tức!");
      setAppState("logged_out"); // Đổi trạng thái React để giao diện tự lật trang mượt mà
    };

    // Đăng ký lắng nghe sự kiện "app-logout" từ trang User bắn lên
    window.addEventListener("app-logout", handleGlobalLogout);
    
    // Hủy lắng nghe khi component bị hủy để tránh rò rỉ bộ nhớ
    return () => window.removeEventListener("app-logout", handleGlobalLogout);
  }, []);

  // ================= ĐIỀU HƯỚNG GIAO DIỆN =================
  
  if (appState === "checking") {
    return <div className="flex h-screen items-center justify-center text-sm">Đang kiểm tra phiên đăng nhập...</div>;
  }

  // 1. KHI ĐĂNG NHẬP (TRƯỢT TỪ PHẢI SANG TRÁI)
  // THÊM key="room-page"
  if (appState === "logged_in") {
    return (
      <div key="room-page" className="h-full w-full animate-in slide-in-from-right-8 fade-in duration-300 ease-out">
        <RoomPage />
      </div>
    );
  }

  // 2. KHI ĐĂNG XUẤT (TRƯỢT TỪ TRÁI SANG PHẢI)
  // THÊM key="auth-page"
  return (
    <div key="auth-page" className="h-full w-full animate-in slide-in-from-left-8 fade-in duration-300 ease-out">
      <AuthSelectPage onLoginSuccess={() => setAppState("logged_in")} />
    </div>
  );
}