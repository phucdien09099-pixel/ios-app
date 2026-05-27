"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"

import { HugeiconsIcon } from "@hugeicons/react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"

export default function ButtonShowInfor() {
    const [open, setOpen] = useState(false)

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            {/* Trigger */}
            <DrawerTrigger asChild>
                <Button variant="outline">
                    <HugeiconsIcon icon={InformationCircleIcon} size={18} />
                </Button>
            </DrawerTrigger>
            {/* Bottom Drawer */}
            <DrawerContent className="mx-auto rounded-2xl bg-white mt-40 w-full">
                <DrawerHeader>
                    <DrawerTitle>Thông tin quyền truy cập</DrawerTitle>
                </DrawerHeader>
                <div className="space-y-3 px-4 pb-6 text-sm text-muted-foreground">
                    <p>• Child user có thể tạo room riêng</p>
                    <p>• Room riêng không hiển thị cho parent</p>
                    <p>• Thiết bị chỉ hiển thị nếu được cấp quyền</p>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
