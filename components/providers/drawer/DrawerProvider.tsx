"use client";

import React, { createContext, useContext, useState } from "react";
import { NestedDrawers } from "./NestedDrawer";

export type DrawerPage = {
    id: string;
    title?: string;

    component: React.ComponentType<any>;
    props?: any;
    monitorConnection?: {
        id?: string;
        name?: string;
        label?: string;
        fallbackIds?: string[];
    };

    renderRightButtonHeader?: React.ReactNode;
    renderHelpButtonHeader?: React.ReactNode;
    direction?: "right" | "left" | "bottom" | "top";
    className?: string;
};
type DrawerContextType = {
    stack: DrawerPage[];
    push: (page: DrawerPage) => void;
    replaceTop: (page: DrawerPage) => void;
    pop: () => void;
    reset: () => void;

};

const DrawerContext = createContext<DrawerContextType | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
    const [stack, setStack] = useState<DrawerPage[]>([]);
    const push = (page: DrawerPage) => {
        setStack((prev) => [...prev, page]);
    };

    const replaceTop = (page: DrawerPage) => {
        setStack((prev) => {
            if (prev.length === 0) return [page];
            return [...prev.slice(0, -1), page];
        });
    };

    const pop = () => {
        setStack((prev) => prev.slice(0, -1));
    };

    const reset = () => setStack([]);
    return (
        <DrawerContext.Provider value={{ stack, push, replaceTop, pop, reset }}>
            {children}
            <NestedDrawers />
        </DrawerContext.Provider>
    );
}

export function useDrawer() {
    const ctx = useContext(DrawerContext);
    if (!ctx) throw new Error("useDrawer must be used inside DrawerProvider");
    return ctx;
}
