import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"; // Bổ sung import Switch
import { Button } from "@/components/ui/button"; // Bổ sung import Button
import { useState } from "react";
import { PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function CreateSmartSceneDrawer() {
    const [form, setForm] = useState({
        name: "",
        time: "18:00",
        room: "Living Room",
        enabled: true,
    });

    const handleSave = () => {
        console.log("Smart Scene Output:", JSON.stringify(form, null, 2));
        setForm({
            name: "",
            time: "18:00",
            room: "Living Room",
            enabled: true,
        });
    };

    return (
        <div className="px-4 pb-6 space-y-4 h-[70vh] overflow-auto">
            {/* Tên kịch bản */}
            <div>
                <div className="mb-2 text-sm font-medium">Tên kịch bản</div>
                <Input
                    placeholder="Ví dụ: Bật đèn buổi tối"
                    value={form.name}
                    onChange={(e) =>
                        setForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                        }))
                    }
                />
            </div>

            {/* Thời gian */}
            <div>
                <div className="mb-2 text-sm font-medium">Thời gian chạy</div>
                <Input
                    type="time"
                    value={form.time}
                    onChange={(e) =>
                        setForm((prev) => ({
                            ...prev,
                            time: e.target.value,
                        }))
                    }
                />
            </div>

            {/* Phòng */}
            <div>
                <div className="mb-2 text-sm font-medium">Phòng</div>
                <Input
                    value={form.room}
                    onChange={(e) =>
                        setForm((prev) => ({
                            ...prev,
                            room: e.target.value,
                        }))
                    }
                />
            </div>

            {/* Trạng thái kích hoạt */}
            <div className="flex items-center justify-between rounded-2xl border p-3">
                <div>
                    <div className="font-medium">Kích hoạt</div>
                    <div className="text-xs text-muted-foreground">
                        Chạy kịch bản sau khi lưu
                    </div>
                </div>

                <Switch
                    checked={form.enabled}
                    onCheckedChange={(enabled) =>
                        setForm((prev) => ({
                            ...prev,
                            enabled,
                        }))
                    }
                />
            </div>

            {/* Nhóm nút bấm */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1 gap-2 rounded-2xl"
                    onClick={() => { }}
                >
                    Hủy
                </Button>
                <Button
                    className="flex-1 gap-2 rounded-2xl"
                    onClick={handleSave}>
                    <HugeiconsIcon icon={PlayIcon} />
                    Lưu
                </Button>
            </div>

            {/* Debug JSON Output */}
            <div>
                <div className="mb-2 text-sm font-medium">Output JSON</div>
                <pre className="overflow-auto rounded-2xl bg-muted p-3 text-xs">
                    {JSON.stringify(form, null, 2)}
                </pre>
            </div>
        </div>
    );
}
