"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

interface HelpButtonProps {
    onClick: () => void;
    className?: string;
}

export default function HelpButton({ onClick, className }: HelpButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Đảm bảo chỉ render Portal khi component đã mount trên client (tránh lỗi Next.js SSR)
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            {/* Nút ? */}
            <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowModal(true);
                }}
                className={cn(
                    "size-8 rounded-full border-primary/40 text-primary font-bold bg-primary/10 hover:bg-primary/20 p-0 transition-colors flex-shrink-0 z-50",
                    className
                )}
                title="Hướng dẫn sử dụng"
            >
                ?
            </Button>

            {/* Dùng createPortal để đưa modal ra hẳn <body>, thoát khỏi Drawer/Dialog */}
            {mounted && showModal && createPortal(
                <div className="fixed top-4 left-0 right-0 z-[999999] flex justify-center px-4 pointer-events-none">
                    {/* Thiết kế lại nhỏ gọn hơn cho Mobile */}
                    <div className="w-full max-w-[260px] bg-background border shadow-2xl rounded-xl p-2 pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300">
                        
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base">👋</span>
                                <h3 className="font-semibold text-sm">Trợ giúp thao tác</h3>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowModal(false); }} 
                                className="text-muted-foreground p-0.5 hover:text-foreground transition-colors"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={16} />
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                            Bạn có muốn xem hướng dẫn cho màn hình này không?
                        </p>

                        <div className="flex justify-end gap-2 mt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-3"
                                onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
                            >
                                Không
                            </Button>
                            <Button
                                size="sm"
                                className="h-7 text-xs px-3 rounded-lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowModal(false);
                                    setTimeout(() => onClick(), 100); 
                                }}
                            >
                                Có
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body // Bắn thẳng ra body, thách mọi loại z-index đè lên
            )}
        </>
    );
}