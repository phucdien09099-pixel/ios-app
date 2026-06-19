"use client";
import React from "react";

interface PullDownGuideProps {
  type?: "room" | "device";
}

export default function PullDownGuide({ type = "room" }: PullDownGuideProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center pointer-events-none select-none">
      <style>{`
        @keyframes swipeDownAction {
          0% { transform: translateY(0px); opacity: 0; }
          20% { transform: translateY(0px); opacity: 1; }
          80% { transform: translateY(50px); opacity: 1; }
          100% { transform: translateY(50px); opacity: 0; }
        }
        .animate-swipe-hand {
          animation: swipeDownAction 2s infinite ease-in-out;
        }
      `}</style>

      {/* 🟢 Hộp thông báo siêu gọn cho Mobile */}
      <div className="mt-6 bg-background/95 backdrop-blur-md border shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border-primary/20 pointer-events-auto mx-auto animate-fade-in">
        <span className="text-lg leading-none">🎉</span>
        <p className="text-[13px] font-medium text-foreground">
          {type === "room" ? (
            <>Tạo phòng xong! <span className="text-primary font-bold">Vuốt xuống</span> làm mới.</>
          ) : (
            <>Thêm thiết bị xong! <span className="text-primary font-bold">Vuốt xuống</span> làm mới.</>
          )}
        </p>
      </div>

      <div className="absolute top-[40%] flex flex-col items-center">
        <div className="animate-swipe-hand text-primary drop-shadow-[0_2px_8px_rgba(var(--primary),0.3)]">
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v9M12 3a1.5 1.5 0 0 1 1.5 1.5V9M12 3a1.5 1.5 0 0 0-1.5 1.5V11" />
            <path d="M13.5 9a1.5 1.5 0 0 1 3 0v3M16.5 10.5a1.5 1.5 0 0 1 3 0v3.5a6 6 0 0 1-12 0V11a1.5 1.5 0 0 1 1.5-1.5z" />
            <path d="M12 15v3m0 0l-2-2m2 2l2-2" strokeWidth="2" opacity="0.7" />
          </svg>
        </div>
      </div>
    </div>
  );
}