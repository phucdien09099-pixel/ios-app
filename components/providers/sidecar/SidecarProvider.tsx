// src/providers/DatabaseProvider.tsx

"use client";
import { useEffect, useRef, useState } from "react";

export function SidecarProvider({ children, }: { children: React.ReactNode; }) {
    const apiURL = useRef('');
    useEffect(() => {
        const isTauri = (window as any).__TAURI__;
        apiURL.current = isTauri ? 'http://localhost:3000' : '/api';
        if (isTauri) {
            import('@tauri-apps/plugin-shell').then((mod) => {
                const command = mod.Command.sidecar('bin/server');
                command.execute();
            });
        }
    }, []);
    return children;
}