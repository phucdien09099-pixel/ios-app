"use client"

import { useForm, Controller } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { roomRepo } from "@/db/repository/RoomRepository"
import { ArrowRight01Icon, Home03Icon, Mail01Icon, PlusSignIcon, SmartPhone01Icon, UserAdd01Icon, } from "@hugeicons/core-free-icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { userRepo } from "@/db/repository/UserRepository"
import { userSessionRepo } from "@/db/repository/UserSessionRepository"
import { User } from "@/db/types/user"
import { useEffect, useState } from "react"
import { getDB } from "@/db"
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer"


type Device = {
    id: string 
    name: string
    allow: boolean
}

type Room = {
    id: string
    name: string
    allow: boolean
    devices: Device[]
}

type FormValues = {
    username: string
    email: string
    rooms: Room[]
}

type Props = {
    member?: User // Nhận prop member từ MemberList truyền sang
    onSuccess?: () => void
}

export default function AddMember({ member, onSuccess }: Props) {
    const { back } = useNavDrawer()
    // 1. Lấy thêm hàm reset từ useForm
    const { control, register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
        defaultValues: {
            username: "",
            email: "",
            rooms: [], // Khởi tạo mảng rỗng
        },
    })

    const rooms = watch("rooms")
    // 2. Thêm state loading
    const [isLoading, setIsLoading] = useState(true)
    
    useEffect(() => {
        const loadHubData = async () => {
            try {
                setIsLoading(true)
                const dbRooms = await roomRepo.getRoomsWithDevices()
                
                // --- XỬ LÝ LẤY QUYỀN CŨ NẾU LÀ CHẾ ĐỘ EDIT ---
                let allowedRoomIds = new Set<string>()
                let allowedDeviceIds = new Set<string>()

                if (member) {
                    const db = await getDB()
                    // Fetch quyền cũ từ DB (Giả sử thư viện DB trả về mảng object)
                    const roomPerms = await db.select('SELECT room_id FROM room_permissions WHERE user_id = $1', [member.id]) as {room_id: string}[]
                    const devicePerms = await db.select('SELECT device_id FROM device_permissions WHERE user_id = $1', [member.id]) as {device_id: string}[]
                    
                    roomPerms.forEach(p => allowedRoomIds.add(p.room_id))
                    devicePerms.forEach(p => allowedDeviceIds.add(p.device_id))
                }

                // Map data sang chuẩn Form
                const formattedRooms: Room[] = dbRooms.map(room => ({
                    id: room.id,
                    name: room.name,
                    allow: allowedRoomIds.has(room.id), // True nếu đã có quyền từ trước
                    devices: (room.devices || []).map((device: any) => ({
                        id: device.id,
                        name: device.name,
                        allow: allowedDeviceIds.has(device.id) // True nếu đã có quyền từ trước
                    }))
                }))

                // Đẩy dữ liệu vào form (Lấy tên/email của member nếu đang edit)
                reset({
                    username: member?.name || "",
                    email: member?.email || "",
                    rooms: formattedRooms
                })
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu Smart Hub:", err)
            } finally {
                setIsLoading(false)
            }
        }

        loadHubData()
    }, [reset, member])

    const onSubmit = async (values: FormValues) => {
        if (!values.email || !values.username) {
            alert("Vui lòng nhập đầy đủ tên và email!");
            return;
        }

        try {
            const session = await userSessionRepo.getLatestActiveUser();
            if (!session) {
                alert("Không tìm thấy phiên đăng nhập. Vui lòng thử lại!");
                return;
            }

            const db = await getDB();
            let targetUserId = "";

            // ===============================================
            // LOGIC LƯU VÀO BẢNG USERS
            // ===============================================
            if (member) {
                // CHẾ ĐỘ SỬA: Cập nhật tên/email và xóa quyền cũ
                targetUserId = member.id;
                
                await db.execute(
                    `UPDATE users SET name = $1, email = $2 WHERE id = $3`, 
                    [values.username, values.email, targetUserId]
                );
                
                // Xóa toàn bộ quyền cũ để tý nữa map lại quyền mới từ form
                await db.execute(`DELETE FROM room_permissions WHERE user_id = $1`, [targetUserId]);
                await db.execute(`DELETE FROM device_permissions WHERE user_id = $1`, [targetUserId]);
            } else {
                // CHẾ ĐỘ THÊM: Tạo user mới (Code cũ của bạn)
                targetUserId = crypto.randomUUID();
                const data: User = {
                    id: targetUserId,
                    name: values.username,
                    email: values.email,
                    is_owner: false,
                    role: "user"
                }
                await userRepo.createChildUser(session.id, data);
            }

            // ===============================================
            // LOGIC LƯU QUYỀN (Dùng chung cho cả Thêm và Sửa)
            // ===============================================
            for (const room of values.rooms) {
                if (room.allow) {
                    const roomPermId = crypto.randomUUID();
                    await db.execute(
                        `INSERT INTO room_permissions (id, room_id, user_id, can_view, can_control, can_edit) VALUES ($1, $2, $3, 1, 1, 0)`,
                        [roomPermId, room.id, targetUserId]
                    );
                }

                for (const device of room.devices) {
                    if (device.allow) {
                        const devicePermId = crypto.randomUUID();
                        await db.execute(
                            `INSERT INTO device_permissions (id, device_id, user_id, can_view, can_control, can_edit) VALUES ($1, $2, $3, 1, 1, 0)`,
                            [devicePermId, device.id, targetUserId]
                        );
                    }
                }
            }

            onSuccess?.(); 
            back(); // GỌI ĐÚNG HÀM BACK CỦA BẠN ĐỂ ĐÓNG DRAWER

        } catch (err: any) {
            console.error("Lỗi hệ thống:", err);
            const errorMessage = err.message || err.toString();
            if (errorMessage.includes("UNIQUE constraint failed: users.email") || errorMessage.includes("2067")) {
                alert(`Email "${values.email}" đã tồn tại trong hệ thống. Vui lòng sử dụng email khác!`);
            } else {
                alert("Đã xảy ra lỗi khi lưu thông tin. Xem console để biết chi tiết.");
            }
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
        {isLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
                Đang tải danh sách phòng và thiết bị...
            </div>
        ) : rooms.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
                Hệ thống chưa có phòng nào.
            </div>
        ) : (
            rooms.map((room, roomIndex) => (
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
                            ))
                        )}
                    </div>
                </CardContent>
                </Card>

                <Button
                    type="submit"
                    className="h-12 w-full rounded-2xl text-base font-medium"
                >
                    {member ? "Lưu thay đổi" : "Thêm thành viên"}
                </Button>
            </div>
        </form>
    )
}
