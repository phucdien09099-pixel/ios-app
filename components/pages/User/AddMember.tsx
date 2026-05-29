"use client"

import { useForm, Controller } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Home03Icon, Mail01Icon, PlusSignIcon, SmartPhone01Icon, UserAdd01Icon, } from "@hugeicons/core-free-icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { userRepo } from "@/db/repository/UserRepository"
import { userSessionRepo } from "@/db/repository/UserSessionRepository"
import { User } from "@/db/types/user"

type Device = {
    id: number
    name: string
    allow: boolean
}

type Room = {
    id: number
    name: string
    allow: boolean
    devices: Device[]
}

type FormValues = {
    username: string
    email: string
    rooms: Room[]
}

const initialRooms: Room[] = [
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

type Props = {
    onSuccess?: () => void
}

export default function AddMember({ onSuccess }: Props) {
    const { control, register, handleSubmit, watch, setValue } = useForm<FormValues>({
        defaultValues: {
            username: "",
            email: "",
            rooms: initialRooms,
        },
    })

    const rooms = watch("rooms")

    const onSubmit = async (values: FormValues) => {
        try {
            const session = await userSessionRepo.getLatestActiveUser();
            console.log(session)
            console.log(values)
            const data: User = {
                id: "2",
                name: values.username,
                email: values.email,
                is_owner: false,
                role: "user"
            }
            // thêm hàm kiểm tra tài khoản tồn tại ở backend
            await userRepo.createChildUser(
                session.id,
                data
            );
            onSuccess?.()
        } catch (err) {
            console.error(err)
        } finally {
            console.log(await userRepo.findAll());
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-muted/30 pb-24">
            <div className="mx-auto max-w-md space-y-5">
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
                            <Label>Tên gợi nhớ</Label>

                            <div className="relative">
                                <HugeiconsIcon
                                    icon={UserAdd01Icon}
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    {...register("username")}
                                    className="h-11 rounded-2xl pl-10"
                                    placeholder="Nhập tên người dùng"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Email / ID</Label>

                            <div className="relative">
                                <HugeiconsIcon
                                    icon={Mail01Icon}
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />

                                <Input
                                    {...register("email")}
                                    className="h-11 rounded-2xl pl-10"
                                    placeholder="example@gmail.com"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                        <div className="space-y-3">
                            {rooms.map((room, roomIndex) => (
                                <div
                                    key={room.id}
                                    className="overflow-hidden rounded-3xl border bg-background"
                                >
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-2xl bg-primary/10 p-2.5">
                                                <HugeiconsIcon
                                                    icon={Home03Icon}
                                                    size={20}
                                                    className="text-primary"
                                                />
                                            </div>

                                            <div>
                                                <div className="font-medium">
                                                    {room.name}
                                                </div>

                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {room.devices.length} thiết bị
                                                </div>
                                            </div>
                                        </div>

                                        <Controller
                                            control={control}
                                            name={`rooms.${roomIndex}.allow`}
                                            render={({ field }) => (
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => {
                                                        field.onChange(checked)

                                                        setValue(
                                                            `rooms.${roomIndex}.devices`,
                                                            room.devices.map((device) => ({
                                                                ...device,
                                                                allow: checked,
                                                            }))
                                                        )
                                                    }}
                                                />
                                            )}
                                        />
                                    </div>

                                    {room.allow && (
                                        <div className="border-t bg-muted/20 px-4 py-3">
                                            <div className="space-y-2">
                                                {room.devices.map((device, deviceIndex) => (
                                                    <div
                                                        key={device.id}
                                                        className="flex items-center justify-between rounded-2xl bg-background px-3 py-2.5"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`h-2.5 w-2.5 rounded-full ${device.allow
                                                                    ? "bg-green-500"
                                                                    : "bg-muted-foreground"
                                                                    }`}
                                                            />

                                                            <span className="text-sm">
                                                                {device.name}
                                                            </span>
                                                        </div>

                                                        <Controller
                                                            control={control}
                                                            name={`rooms.${roomIndex}.devices.${deviceIndex}.allow`}
                                                            render={({ field }) => (
                                                                <Switch
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Button
                    type="submit"
                    className="h-12 w-full rounded-2xl text-base font-medium"
                >
                    Thêm thành viên
                </Button>
            </div>
        </form>
    )
}
