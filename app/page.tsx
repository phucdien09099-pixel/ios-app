"use client";

import * as React from "react";
import { apiClient } from "@/utils/Tauri/HttpClient";
import { userSessionRepo } from "@/db/repository/UserSessionRepository";
import { RoomPage } from "@/components/pages/Home";
import AuthSelectPage from "@/components/pages/auth";

export default function EntryPointPage() {
  const [appState, setAppState] = React.useState<"checking" | "logged_out" | "logged_in">("checking");

  React.useEffect(() => {
    async function autoLogin() {
      try {
        const activeUser = await userSessionRepo.getLatestActiveUser();

        if (activeUser) {
          console.log("Tìm thấy phiên đăng nhập cũ hợp lệ:", activeUser);
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: activeUser.id,
              accountId: activeUser.id,
              email: activeUser.email,
              name: activeUser.name || activeUser.email?.split("@")[0] || "User",
              parentId: activeUser.parent_id ?? null,
              is_owner: activeUser.is_owner,
            })
          );
          await apiClient.setAccessToken(activeUser.access_token);
          await apiClient.setRefreshToken(activeUser.refresh_token);
          const hasValidSession = await apiClient.ensureValidAccessToken();
          setAppState(hasValidSession ? "logged_in" : "logged_out");
        } else {
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
      setAppState("logged_out");
    };

    window.addEventListener("app-logout", handleGlobalLogout);

    return () => window.removeEventListener("app-logout", handleGlobalLogout);
  }, []);


  if (appState === "checking") {
    return <div className="flex h-screen items-center justify-center text-sm">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (appState === "logged_in") {
    return (
      <div key="room-page" className="h-full w-full animate-in slide-in-from-right-8 fade-in duration-300 ease-out">
        <RoomPage />
      </div>
    );
  }

  return (
    <div key="auth-page" className="h-full w-full animate-in slide-in-from-left-8 fade-in duration-300 ease-out">
      <AuthSelectPage onLoginSuccess={() => setAppState("logged_in")} />
    </div>
  );
}
