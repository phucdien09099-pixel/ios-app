"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Sun01Icon, Clock01Icon, LightbulbOffIcon } from "@hugeicons/core-free-icons";

interface SceneTypeSelectorProps {
  onSelectAutomation: () => void;
}

export function SceneTypeSelector({ onSelectAutomation }: SceneTypeSelectorProps) {
  return (
    <div className="space-y-3">
      {/* Tự động (Cảm biến) */}
      <div 
        onClick={onSelectAutomation}
        className="flex items-center justify-between p-4 bg-muted/40 hover:bg-muted/80 rounded-2xl cursor-pointer transition-colors active:scale-[0.98]"
      >
        <div className="flex items-start gap-4">
          <div className="mt-0.5 text-orange-500">
            <HugeiconsIcon icon={Sun01Icon} size={24} /> 
          </div>
          <div>
            <div className="font-medium">Tự động (Cảm biến)</div>
            <div className="text-xs text-muted-foreground mt-1 pr-4 leading-relaxed">
              Ví dụ: Nếu nhiệt độ &gt; 28°C thì bật máy lạnh.
            </div>
          </div>
        </div>
        <HugeiconsIcon icon={ArrowRight01Icon} className="text-muted-foreground shrink-0 w-5 h-5" />
      </div>

      {/* Các menu khác giữ nguyên ... */}
      <div className="flex items-center justify-between p-4 bg-muted/40 opacity-70 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 text-yellow-500">
            <HugeiconsIcon icon={Sun01Icon} size={24} />
          </div>
          <div>
            <div className="font-medium">Khi thời tiết thay đổi</div>
            <div className="text-xs text-muted-foreground mt-1 pr-4 leading-relaxed">
              Ví dụ: khi nhiệt độ lớn hơn 28°C.
            </div>
          </div>
        </div>
        <HugeiconsIcon icon={ArrowRight01Icon} className="text-muted-foreground shrink-0 w-5 h-5" />
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/40 opacity-70 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 text-blue-500">
            <HugeiconsIcon icon={Clock01Icon} size={24} />
          </div>
          <div>
            <div className="font-medium">Lịch</div>
            <div className="text-xs text-muted-foreground mt-1 pr-4 leading-relaxed">
              Ví dụ: 7:00 mỗi sáng
            </div>
          </div>
        </div>
        <HugeiconsIcon icon={ArrowRight01Icon} className="text-muted-foreground shrink-0 w-5 h-5" />
      </div>
    </div>
  );
}