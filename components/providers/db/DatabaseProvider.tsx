// src/providers/DatabaseProvider.tsx

"use client";

import { initDB } from "@/db/init";
import { useEffect, useState } from "react";

export function DatabaseProvider({ children, }: { children: React.ReactNode; }) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        async function setup() {
            try {
                await initDB();
                setReady(true);
            } catch (error) {
                console.error("Init DB Error", error);
            }
        }
        setup();
    }, []);
    if (!ready) {
        return (
            <div>
                Loading Database...
            </div>
        );
    }
    return children;
}