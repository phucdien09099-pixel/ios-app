"use client";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MailCheck, RefreshCw } from "lucide-react";
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";
import { apiClient } from "@/utils/Tauri/HttpClient";
import { ResetPasswordForm } from "./reset-password-form";

interface ForgotPasswordOtpProps {
  email: string;
}

export function ForgotPasswordOtp({ email }: ForgotPasswordOtpProps) {
  const [otp, setOtp] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const [countdown, setCountdown] = useState(60);
  const { open } = useNavDrawer();

  useEffect(() => {
    if (otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, []);
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số!");
      return;
    }

    setIsVerifying(true);

    try {
      await apiClient.post(
        "/api/auth/otp/verify",
        { email, otp, purpose: "PASSWORD_RESET" },
        { auth: false }
      );

      open({
        id: "reset-password-form",
        title: "",
        component: ResetPasswordForm,
        props: { email, otp },
      });
    } catch (error) {
      console.error("Lỗi khi xác thực OTP quên mật khẩu:", error);
      toast.error("Mã xác thực không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại!");
      setOtp("");
      otpInputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      await apiClient.post("/api/auth/password/forgot", { email }, { auth: false });
      toast.success("Đã gửi lại mã xác thực mới!");
      setCountdown(60);
      setOtp("");
      otpInputRef.current?.focus();
    } catch (error) {
      console.error("Lỗi khi gửi lại mã OTP:", error);
      toast.error("Không thể gửi lại mã. Vui lòng thử lại sau!");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full flex flex-col pt-0 px-2">
      <div className="w-full text-left mb-10">
        <p className="text-[14px] text-muted-foreground">
          Đã gửi mã xác thực đến: <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      <div className="flex flex-col items-center mb-12">
        <div className="bg-primary/10 p-4 rounded-full mb-4 text-primary">
          <MailCheck className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Nhập mã xác thực</h2>
      </div>

      <form onSubmit={handleVerify} className="flex flex-col w-full items-center">
        <div className="relative w-full max-w-[340px] flex justify-center mb-8">
          <input
            ref={otpInputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-default z-10"
            style={{ fontSize: "16px" }}
            disabled={isVerifying}
          />

          <div className="flex gap-3" onClick={() => !isVerifying && otpInputRef.current?.focus()}>
            {Array.from({ length: 6 }).map((_, i) => {
              const char = otp[i] || "";
              const isFocused = otp.length === i && !isVerifying;
              return (
                <div
                  key={i}
                  className={`w-12 h-14 flex items-center justify-center text-2xl font-bold rounded-xl border bg-background transition-all duration-200 ${
                    isFocused
                      ? "border-b-4 border-b-primary border-t-muted border-x-muted scale-110 shadow-sm"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {char}
                  {!char && isFocused && (
                    <span className="w-[2px] h-6 bg-primary animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-[340px] flex justify-end mb-16">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Không nhận được mã?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isVerifying || isResending || countdown > 0}
              className={`
                flex items-center gap-1 transition-all duration-200
                ${
                  countdown > 0
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-primary font-bold hover:text-primary/80"
                }
              `}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`}
              />

              {countdown > 0 ? (
                <>
                  Gửi lại{" "}
                  <span className="font-bold text-foreground">
                    ({countdown})
                  </span>
                </>
              ) : (
                <span className="font-bold">Gửi lại mã</span>
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={otp.length < 6 || isVerifying}
          className="w-full max-w-[340px] h-12 text-base font-semibold rounded-xl"
        >
          {isVerifying ? "Đang xử lý..." : "Xác thực"}
        </Button>
      </form>
    </div>
  );
}
