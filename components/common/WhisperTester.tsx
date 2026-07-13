"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { triggerSmartWhisper, clearWhisperImmediately } from "@/libs/whisperUtils";

export default function WhisperTester() {
    const pathname = usePathname();

    useEffect(() => {
        const initialTimeout = setTimeout(() => {
            triggerSmartWhisper(false, false); 
        }, 1500);

        return () => {
            clearTimeout(initialTimeout);
            clearWhisperImmediately();
        };
    }, [pathname]);

    return null; 
}