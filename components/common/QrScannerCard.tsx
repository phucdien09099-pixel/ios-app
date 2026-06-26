"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { Camera01Icon, CheckmarkCircle02Icon, QrCodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";

type QrScannerCardProps = {
    title: string;
    description?: string;
    value?: string;
    valueLabel?: string;
    buttonLabel?: string;
    rescanLabel?: string;
    busyLabel?: string;
    disabled?: boolean;
    busy?: boolean;
    className?: string;
    dataTour?: string;
    validate?: (value: string) => string | null | undefined;
    onScan: (value: string) => void | Promise<void>;
};

export default function QrScannerCard({
    title,
    description,
    value,
    valueLabel = "Mã đã quét",
    buttonLabel = "Mở camera quét QR",
    rescanLabel = "Quét lại",
    busyLabel = "Đang xử lý...",
    disabled = false,
    busy = false,
    className,
    dataTour,
    validate,
    onScan,
}: QrScannerCardProps) {
    const [scannerOpen, setScannerOpen] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const scannerRef = useRef<QrScanner | null>(null);
    const qrHandledRef = useRef(false);
    const onScanRef = useRef(onScan);
    const validateRef = useRef(validate);

    useEffect(() => {
        onScanRef.current = onScan;
        validateRef.current = validate;
    }, [onScan, validate]);

    useEffect(() => {
        if (!scannerOpen || !videoRef.current) return;

        qrHandledRef.current = false;
        setCameraReady(false);
        setCameraError("");

        const scanner = new QrScanner(
            videoRef.current,
            async (result) => {
                if (qrHandledRef.current) return;

                const scannedValue = result.data.trim();
                const validationError = validateRef.current?.(scannedValue);

                if (validationError) {
                    setCameraError(validationError);
                    return;
                }

                qrHandledRef.current = true;
                setScannerOpen(false);
                await onScanRef.current(scannedValue);
            },
            {
                preferredCamera: "environment",
                highlightScanRegion: true,
                highlightCodeOutline: true,
                maxScansPerSecond: 8,
                returnDetailedScanResult: true,
            }
        );

        scannerRef.current = scanner;
        scanner.start().catch((error) => {
            console.error("Không thể mở camera sau:", error);
            setCameraError("Không thể mở camera. Vui lòng cấp quyền camera cho ứng dụng.");
        });

        return () => {
            scanner.stop();
            scanner.destroy();
            scannerRef.current = null;
        };
    }, [scannerOpen]);

    const closeScanner = () => {
        setScannerOpen(false);
        setCameraReady(false);
    };

    const openScanner = () => {
        setCameraError("");
        setCameraReady(false);
        setScannerOpen(true);
    };

    return (
        <div data-tour={dataTour} className={cn("flex flex-col gap-3 rounded-2xl border bg-card p-4", className)}>
            <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                    <HugeiconsIcon icon={QrCodeIcon} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-medium">{title}</p>
                    {description ? (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    ) : null}
                </div>
                {value ? <HugeiconsIcon icon={CheckmarkCircle02Icon} className="text-green-600" /> : null}
            </div>

            {scannerOpen ? (
                <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
                    <video
                        ref={videoRef}
                        className="size-full object-cover"
                        muted
                        playsInline
                        onCanPlay={() => setCameraReady(true)}
                    />
                    {!cameraReady ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <div className="flex size-20 items-center justify-center rounded-full bg-background ring-1 ring-border">
                                <HugeiconsIcon icon={Camera01Icon} className="animate-pulse text-muted-foreground" />
                            </div>
                        </div>
                    ) : (
                        <div className="pointer-events-none absolute inset-[15%] rounded-xl border-2 border-white/80" />
                    )}
                </div>
            ) : null}

            {cameraError ? <p className="text-xs text-destructive">{cameraError}</p> : null}

            {value ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-green-500 bg-green-50 p-3 dark:bg-green-900/20">
                    <div className="min-w-0">
                        <p className="text-sm font-medium">{valueLabel}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{value}</p>
                    </div>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="text-green-600" />
                </div>
            ) : null}

            <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-xl"
                disabled={disabled || busy}
                onClick={scannerOpen ? closeScanner : openScanner}
            >
                <HugeiconsIcon icon={scannerOpen ? Camera01Icon : QrCodeIcon} data-icon="inline-start" />
                {scannerOpen ? "Đóng camera" : busy ? busyLabel : value ? rescanLabel : buttonLabel}
            </Button>
        </div>
    );
}
