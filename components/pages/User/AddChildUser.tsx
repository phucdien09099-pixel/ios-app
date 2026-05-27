"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    ArrowRight01Icon,
    Home03Icon,
    Mail01Icon,
    PlusSignIcon,
    SmartPhone01Icon,
    UserAdd01Icon,
} from "@hugeicons/core-free-icons"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

const initialRooms = [
    {
        id: 1,
        name: "Phòng khách",
        allow: true,
        devices: [
            { id: 1, name: "Đèn trần", allow: true },
            { id: 2, name: "TV", allow: false },
            { id: 3, name: "Máy lạnh", allow: true },
        ],
    },
    {
        id: 2,
        name: "Phòng ngủ",
        allow: false,
        devices: [
            { id: 1, name: "Đèn ngủ", allow: false },
            { id: 2, name: "Quạt", allow: false },
        ],
    },
    {
        id: 3,
        name: "Nhà bếp",
        allow: true,
        devices: [
            { id: 1, name: "Đèn bếp", allow: true },
            { id: 2, name: "Máy hút mùi", allow: true },
        ],
    },
]

export default function AddChildUser() {
    const [rooms, setRooms] = useState(initialRooms)

    const toggleRoom = (roomId: number) => {
        setRooms((prev) =>
            prev.map((room) =>
                room.id === roomId ? { ...room, allow: !room.allow } : room
            )
        )
    }

    const toggleDevice = (roomId: number, deviceId: number) => {
        setRooms((prev) =>
            prev.map((room) =>
                room.id === roomId
                    ? {
                        ...room,
                        devices: room.devices.map((device) =>
                            device.id === deviceId ? { ...device, allow: !device.allow } : device
                        ),
                    }
                    : room
            )
        )
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-24">
            <div className="mx-auto max-w-md space-y-5">
                {/* User Information */}
                <Card className="rounded-3xl border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <HugeiconsIcon icon={UserAdd01Icon} size={20} />
                            Thông tin người dùng
                        </CardTitle>
                        <CardDescription>
                            Child user có thể được cấp quyền điều khiển thiết bị trong Smart Hub
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tên người dùng</Label>
                            <div className="relative">
                                <HugeiconsIcon icon={UserAdd01Icon} size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input className="h-11 rounded-2xl pl-10" placeholder="Nhập tên người dùng" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email / ID</Label>
                            <div className="relative">
                                <HugeiconsIcon icon={Mail01Icon} size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input className="h-11 rounded-2xl pl-10" placeholder="example@gmail.com" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Permissions */}
                <Card className="rounded-3xl border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <HugeiconsIcon icon={SmartPhone01Icon} size={20} />
                            Quyền truy cập Smart Hub
                        </CardTitle>
                        <CardDescription>
                            Chọn room và thiết bị mà thành viên được phép thấy
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Rooms List */}
                        <div className="space-y-3">
                            {rooms.map((room) => (
                                <div key={room.id} className="overflow-hidden rounded-3xl border bg-background">
                                    {/* Room Header */}
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-2xl bg-primary/10 p-2.5">
                                                <HugeiconsIcon icon={Home03Icon} size={20} className="text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{room.name}</div>
                                                <div className="mt-1 text-xs text-muted-foreground">{room.devices.length} thiết bị</div>
                                            </div>
                                        </div>
                                        <Switch checked={room.allow} onCheckedChange={() => toggleRoom(room.id)} />
                                    </div>

                                    {/* Devices List under Room */}
                                    {room.allow && (
                                        <div className="border-t bg-muted/20 px-4 py-3">
                                            <div className="space-y-2">
                                                {room.devices.map((device) => (
                                                    <div key={device.id} className="flex items-center justify-between rounded-2xl bg-background px-3 py-2.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-2.5 w-2.5 rounded-full ${device.allow ? "bg-green-500" : "bg-muted-foreground"}`} />
                                                            <span className="text-sm">{device.name}</span>
                                                        </div>
                                                        <Switch checked={device.allow} onCheckedChange={() => toggleDevice(room.id, device.id)} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Private Room Button */}
                        <button className="flex w-full items-center justify-between rounded-2xl border border-dashed bg-background p-4 transition-colors hover:bg-muted/40">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-primary/10 p-2.5">
                                    <HugeiconsIcon icon={PlusSignIcon} size={20} className="text-primary" />
                                </div>
                                <div className="text-left">
                                    <div className="font-medium">Tạo room riêng</div>
                                    <div className="text-xs text-muted-foreground">Room này chỉ thành viên nhìn thấy</div>
                                </div>
                            </div>
                            <HugeiconsIcon icon={ArrowRight01Icon} size={18} className="text-muted-foreground" />
                        </button>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <Button className="h-12 w-full rounded-2xl text-base font-medium">
                    Thêm thành viên
                </Button>
            </div>
        </div>
    )
}
