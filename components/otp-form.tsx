"use client";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MailCheck, RefreshCw } from "lucide-react";

interface OtpFormProps {
  email: string;
  onVerifySuccess: () => void;
}

export function OtpForm({ email, onVerifySuccess }: OtpFormProps) {
  const [otp, setOtp] = useState<string>("");
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số!");
      return;
    }
    onVerifySuccess();
  };

  const handleResend = () => {
    toast.info(`Đã gửi lại mã xác thực mới!`);
    setOtp("");
    otpInputRef.current?.focus();
  };

  return (
    <div className="w-full flex flex-col pt-0 px-2">
      {/* 1. Kéo chữ Đã gửi mã xác thực lên sát phần Header/Nút Back */}
      <div className="w-full text-left mb-10">
        <p className="text-[14px] text-muted-foreground">
          Đã gửi mã xác thực đến: <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      {/* 2. Dịch Icon và Tiêu đề lên trên một chút */}
      <div className="flex flex-col items-center mb-12">
        <div className="bg-primary/10 p-4 rounded-full mb-4 text-primary">
          <MailCheck className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Nhập mã xác thực</h2>
      </div>

      {/* 3. Khu vực ô nhập mã thoáng đãng */}
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
          />

          <div className="flex gap-3" onClick={() => otpInputRef.current?.focus()}>
            {Array.from({ length: 6 }).map((_, i) => {
              const char = otp[i] || "";
              const isFocused = otp.length === i;
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

        {/* 4. Chữ Gửi lại mã căn góc phải, cách xa bên dưới */}
        <div className="w-full max-w-[340px] flex justify-end mb-16">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Không nhận được mã?</span>
            <button 
              type="button" 
              onClick={handleResend}
              className="text-foreground font-semibold hover:text-primary transition-colors flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Gửi lại mã
            </button>
          </div>
        </div>

        {/* 5. Nút Xác Thực */}
        <Button 
          type="submit" 
          size="lg"
          disabled={otp.length < 6}
          className="w-full max-w-[340px] h-12 text-base font-semibold rounded-xl"
        >
          Xác Thực
        </Button>
      </form>
    </div>
  );
}