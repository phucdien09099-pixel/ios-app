"use client";

import * as React from "react";
import { cn } from "@/libs/utils";
import { TIMEZONES } from "@/libs/timezones";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon,
  ArrowUpDownIcon,
  GlobalIcon,
  Search01Icon
} from "@hugeicons/core-free-icons";

interface TimezoneComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimezoneCombobox({ value, onChange }: TimezoneComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const getDisplayLabel = (tz: string) => {
    if (!tz) return "Tự động xác định múi giờ...";
    const parts = tz.split("/");
    let cityName = parts[parts.length - 1].replace(/_/g, " ");
    
    // Việt hóa duy nhất chữ Hồ Chí Minh cho đẹp mắt
    if (cityName === "Ho Chi Minh") cityName = "Hồ Chí Minh"; 
    return cityName;
  };

  // Khởi tạo múi giờ hệ thống và ép về CHUỖI CHUẨN ĐÚNG NGHĨA trong libs/timezones.ts
  const systemTimezone = React.useMemo(() => {
    try {
      let tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Bắt bài lỗi generic (Etc/GMT-7 hoặc Asia/Saigon) trên máy người dùng Việt Nam
      // và ép thẳng về chuỗi chuẩn có trong file libs/timezones.ts của bạn
      if (tz === "Etc/GMT-7" || tz === "GMT-7" || tz === "Asia/Saigon") {
        tz = "Asia/Ho_Chi_Minh";
      }
      
      // Bắt buộc chuỗi gợi ý phải tồn tại khớp 100% trong file libs/timezones.ts mới cho dùng
      if (TIMEZONES.includes(tz)) return tz;
      
      return "Asia/Ho_Chi_Minh"; // Fallback an toàn nếu không tìm thấy
    } catch (e) {
      return "Asia/Ho_Chi_Minh";
    }
  }, []);

  const groupedTimezones = React.useMemo(() => {
    const groups: Record<string, string[]> = {};
    const query = searchQuery.toLowerCase().trim();

    // 1. TẠO NHÓM "Gợi ý" (Chỉ hiện khi chưa gõ tìm kiếm)
    if (!query) {
      const suggested: string[] = [];
      if (TIMEZONES.includes(systemTimezone)) suggested.push(systemTimezone);
      if (value && value !== systemTimezone && TIMEZONES.includes(value)) {
        suggested.push(value);
      }
      if (suggested.length > 0) {
        groups["Gợi ý"] = suggested;
      }
    }

    // 2. PHÂN LỌC VÀ GOM NHÓM CÒN LẠI
    TIMEZONES.forEach((tz) => {
      const displayLabel = getDisplayLabel(tz).toLowerCase();
      const rawTz = tz.toLowerCase();

      if (query && !displayLabel.includes(query) && !rawTz.includes(query)) {
        return;
      }

      const parts = tz.split("/");
      let groupName = parts.length > 1 ? parts[0] : "Hệ thống & Khác";
      if (groupName === "Asia") groupName = "Châu Á";
      if (groupName === "Europe") groupName = "Châu Âu";
      if (groupName === "America") groupName = "Châu Mỹ";
      if (groupName === "Africa") groupName = "Châu Phi";
      if (groupName === "Australia") groupName = "Châu Úc";
      if (["Etc", "GMT", "UTC"].includes(groupName)) groupName = "Hệ thống & Khác";

      if (!groups[groupName]) groups[groupName] = [];
      
      // Bỏ qua không nhét thêm vào nhóm Châu lục nếu đã nằm ở mục Gợi ý
      if (!query && groups["Gợi ý"]?.includes(tz)) return;

      groups[groupName].push(tz);
    });

    // 3. SẮP XẾP BẢNG CHỮ CÁI A-Z
    Object.keys(groups).forEach((key) => {
      if (key !== "Gợi ý") {
        groups[key].sort((a, b) => getDisplayLabel(a).localeCompare(getDisplayLabel(b)));
      }
    });

    return groups;
  }, [searchQuery, systemTimezone, value]);

  return (
    <div className="relative w-full" ref={containerRef}>
      
      {/* NÚT BẤM (TRIGGER) */}
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setSearchQuery(""); 
        }}
        className="flex w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm font-normal text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-10 transition-colors"
      >
        <div className="flex items-center gap-2 text-foreground truncate">
          <HugeiconsIcon icon={GlobalIcon} size={16} className="text-primary shrink-0" />
          <span className="truncate">{getDisplayLabel(value)}</span>
        </div>
        <HugeiconsIcon icon={ArrowUpDownIcon} size={16} className="ml-2 shrink-0 opacity-50" />
      </button>

      {open && (
        /* ✨ FIX 1: Đổi bottom-[calc(100%+4px)] để Menu hiển thị hất ngược lên trên thay vì đâm xuống dưới */
        <div className="absolute left-0 right-0 bottom-[calc(100%+4px)] z-[99999] flex max-h-[280px] flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2">
          
          <div className="flex items-center border-b px-3">
            <HugeiconsIcon icon={Search01Icon} size={16} className="mr-2 shrink-0 opacity-50" />
            <input
              type="text"
              placeholder="Tìm kiếm múi giờ..."
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* ✨ FIX 2: Thêm onWheel và onTouchMove để CHẶN Drawer cướp quyền cuộn danh sách */}
          <div 
            className="overflow-y-auto p-1 flex-1 overscroll-contain"
            onWheel={(e) => e.stopPropagation()} 
            onTouchMove={(e) => e.stopPropagation()} 
          >
            {Object.keys(groupedTimezones).length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Không tìm thấy múi giờ.
              </div>
            ) : (
              Object.entries(groupedTimezones).map(([region, tzs]) => (
                <div key={region} className="mb-2">
                  <div className={cn(
                    "px-2 py-1.5 text-xs font-semibold sticky top-0 backdrop-blur-sm z-10 uppercase tracking-wider",
                    region === "Gợi ý"
                      ? "bg-primary/10 text-primary" // Màu nhấn cho mục Gợi ý
                      : "bg-muted/30 text-muted-foreground"
                  )}>
                    {region}
                  </div>
                  {tzs.map((tz) => {
                    const isSelected = value === tz;
                    return (
                      <button
                        key={tz}
                        type="button"
                        onClick={() => {
                          onChange(tz);
                          setOpen(false);
                        }}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                          isSelected && "bg-accent text-accent-foreground font-medium"
                        )}
                      >
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          size={16}
                          className={cn(
                            "mr-2 shrink-0 text-primary",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{getDisplayLabel(tz)}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}