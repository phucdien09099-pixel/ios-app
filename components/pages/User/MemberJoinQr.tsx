"use client"

import { useEffect, useMemo, useState } from "react"
import QRCode from "qrcode"
import { HugeiconsIcon } from "@hugeicons/react"
import { QrCodeIcon, UserIcon } from "@hugeicons/core-free-icons"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const MEMBER_QR_TYPE = "SMART_IR_MEMBER_PROFILE"

export type MemberQrPayload = {
    type: typeof MEMBER_QR_TYPE
    version: 1
    accountId: string
    email: string
    name: string
    createdAt: string
}

export function buildMemberQrPayload(user: { accountId?: string; id?: string; email?: string; name?: string }): MemberQrPayload {
    return {
        type: MEMBER_QR_TYPE,
        version: 1,
        accountId: String(user.accountId || user.id || ""),
        email: user.email || "",
        name: user.name || user.email?.split("@")[0] || "Thành viên",
        createdAt: new Date().toISOString(),
    }
}

export function parseMemberQrPayload(rawValue: string): MemberQrPayload {
    const parsed = JSON.parse(rawValue) as Partial<MemberQrPayload>

    if (parsed.type !== MEMBER_QR_TYPE) {
        throw new Error("QR không phải mã thành viên Smart IR")
    }

    if (!parsed.accountId || !/^\d+$/.test(String(parsed.accountId))) {
        throw new Error("QR thiếu Account ID hợp lệ")
    }

    if (!parsed.email) {
        throw new Error("QR thiếu email tài khoản")
    }

    return {
        type: MEMBER_QR_TYPE,
        version: 1,
        accountId: String(parsed.accountId),
        email: String(parsed.email),
        name: String(parsed.name || parsed.email.split("@")[0]),
        createdAt: String(parsed.createdAt || new Date().toISOString()),
    }
}

export default function MemberJoinQr() {
    const [qrDataUrl, setQrDataUrl] = useState("")
    const [error, setError] = useState("")

    const payload = useMemo(() => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}")
            return buildMemberQrPayload(user)
        } catch {
            return buildMemberQrPayload({})
        }
    }, [])

    useEffect(() => {
        if (!payload.accountId || !payload.email) {
            setError("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại để tạo QR thành viên.")
            return
        }

        QRCode.toDataURL(JSON.stringify(payload), {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 280,
            color: {
                dark: "#111827",
                light: "#ffffff",
            },
        })
            .then(setQrDataUrl)
            .catch(() => setError("Không thể tạo QR thành viên. Vui lòng thử lại."))
    }, [payload])

    return (
        <div className="min-h-[80vh] bg-muted/30 px-4 py-6">
            <div className="mx-auto max-w-md space-y-4">
                <Card className="rounded-3xl border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <HugeiconsIcon icon={QrCodeIcon} size={20} />
                            QR để trở thành thành viên
                        </CardTitle>
                        <CardDescription>
                            Đưa mã này cho chủ nhà quét để cấp quyền xem và điều khiển thiết bị.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error ? (
                            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                                {error}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="rounded-[2rem] bg-white p-4 shadow-inner ring-1 ring-border">
                                    {qrDataUrl ? (
                                        <img src={qrDataUrl} alt="QR thành viên" className="size-64" />
                                    ) : (
                                        <div className="flex size-64 items-center justify-center rounded-3xl bg-muted text-sm text-muted-foreground">
                                            Đang tạo QR...
                                        </div>
                                    )}
                                </div>

                                <div className="w-full rounded-2xl border bg-background p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <HugeiconsIcon icon={UserIcon} size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{payload.name}</p>
                                            <p className="truncate text-xs text-muted-foreground">{payload.email}</p>
                                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                Account ID: {payload.accountId}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

