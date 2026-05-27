"use client";

import React, { createContext, useContext, useState } from "react";
import { NestedDrawers } from "./NestedDrawer";

export type DrawerPage = {
    id: string;
    title?: string;
    element: React.ReactNode;
    renderRightButtonHeader?: React.ReactNode;
};

type DrawerContextType = {
    stack: DrawerPage[];
    push: (page: DrawerPage) => void;
    pop: () => void;
    reset: () => void;

};

const DrawerContext = createContext<DrawerContextType | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
    const [stack, setStack] = useState<DrawerPage[]>([]);
    const currentPage = stack[stack.length - 1];

    const push = (page: DrawerPage) => {
        setStack((prev) => [...prev, page]);
    };

    const pop = () => {
        setStack((prev) => prev.slice(0, -1));
    };

    const reset = () => setStack([]);
    return (
        <DrawerContext.Provider value={{ stack, push, pop, reset }}>
            {children}
            <NestedDrawers rightButton={currentPage?.renderRightButtonHeader} />
        </DrawerContext.Provider>
    );
}

export function useDrawer() {
    const ctx = useContext(DrawerContext);
    if (!ctx) throw new Error("useDrawer must be used inside DrawerProvider");
    return ctx;
}