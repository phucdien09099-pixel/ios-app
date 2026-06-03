"use client"

import { useCallback, useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    Delete02Icon,
    PlusSignIcon,
    UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { userRepo } from "@/db/repository/UserRepository"
import { userSessionRepo } from "@/db/repository/UserSessionRepository"
import { User, UserRole } from "@/db/types/user"
import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer"
import AddMember from "./AddMember"

const roleLabels: Record<UserRole, string> = {
    owner: "Chủ sở hữu",
    admin: "Quản trị",
    user: "Thành viên",
    viewer: "Xem",
}

const roleVariants: Record<UserRole, "default" | "secondary" | "outline"> = {
    owner: "default",
    admin: "default",
    user: "secondary",
    viewer: "outline",
}

export default function MemberList() {
    const { open } = useNavDrawer()
    const [members, setMembers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
    const [deleting, setDeleting] = useState(false)

    const loadMembers = useCallback(async () => {
        try {
            setLoading(true)
            const session = await userSessionRepo.getLatestActiveUser()
            const children = await userRepo.findChildren(session.id)
            setMembers(children)
        } catch (err) {
            console.error("Failed to load members:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadMembers()
    }, [loadMembers])

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await userRepo.deleteUser(deleteTarget.id)
            setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id))
        } catch (err) {
            console.error("Failed to delete member:", err)
        } finally {
            setDeleting(false)
            setDeleteTarget(null)
        }
    }

    const openAddMember = () => {
        open({
            id: "add_member",
            title: "Thêm thành viên",
            component: AddMember,
            props: { onSuccess: loadMembers },
        })
    }
    const openEditMember = (member: User) => {
        open({
            id: "edit_member", // ID khác đi một chút để phân biệt
            title: "Cập nhật quyền thành viên", 
            component: AddMember,
            // Truyền thêm prop member để sang bên AddMember bạn biết là đang sửa ai
            props: { 
                member: member, 
                onSuccess: loadMembers 
            },
        })
    }

    return (
        <div className="min-h-[90vh] bg-muted/30 pb-24">
            <div className="mx-auto max-w-md space-y-4">
                {/* Stats card */}
                <Card className="ring-0!">
                    <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-primary/10 p-2.5">
                                <HugeiconsIcon
                                    icon={UserGroupIcon}
                                    size={20}
                                    className="text-primary"
                                />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Tổng thành viên
                                </p>
                                <p className="text-2xl font-bold leading-tight">
                                    {loading ? "—" : members.length}
                                </p>
                            </div>
                        </div>
                        <Button className="rounded-2xl gap-1.5" onClick={openAddMember}>
                            <HugeiconsIcon icon={PlusSignIcon} size={16} />
                            Thêm
                        </Button>
                    </CardContent>
                </Card>

                {/* Member list card */}
                <Card className="ring-0!">
                    <CardContent className="p-0">
                        {loading ? (
                            /* Skeleton loading */
                            <div className="divide-y">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-4 px-5 py-4">
                                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : members.length === 0 ? (
                            /* Empty state */
                            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                                <div className="rounded-full bg-muted p-4 mb-3">
                                    <HugeiconsIcon
                                        icon={UserGroupIcon}
                                        size={28}
                                        className="text-muted-foreground"
                                    />
                                </div>
                                <p className="text-sm font-medium">Chưa có thành viên</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Thêm thành viên để chia sẻ điều khiển
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4 rounded-2xl gap-1.5"
                                    onClick={openAddMember}
                                >
                                    <HugeiconsIcon icon={PlusSignIcon} size={16} />
                                    Thêm ngay
                                </Button>
                            </div>
                        ) : (
                            /* Member rows */
                            <div className="divide-y">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        onClick={() => openEditMember(member)}
                                        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                        <Avatar className="h-10 w-10 shrink-0 border border-border">
                                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                                {member.name.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium truncate">
                                                    {member.name}
                                                </p>
                                                <Badge
                                                    variant={roleVariants[member.role] ?? "secondary"}
                                                    className="text-xs shrink-0"
                                                >
                                                    {roleLabels[member.role] ?? member.role}
                                                </Badge>
                                            </div>
                                            <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                                {member.email}
                                            </p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => {
                                                e.stopPropagation(); // NGĂN SỰ KIỆN CLICK LAN RA DÒNG BÊN NGOÀI
                                                setDeleteTarget(member);
                                            }}
                                        >
                                            <HugeiconsIcon icon={Delete02Icon} size={18} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xoá thành viên?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xoá{" "}
                            <strong>{deleteTarget?.name}</strong> khỏi hệ thống?
                            Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Huỷ</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Xoá
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
