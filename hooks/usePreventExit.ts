"use client";

import { useEffect } from "react";

export function usePreventExit(
    onBack?: () => boolean | void
) {
    useEffect(() => {
        window.history.pushState(
            { noExit: true },
            "",
            window.location.href
        );

        const handlePopState = () => {
            const handled = onBack?.();

            if (handled) {
                window.history.pushState(
                    { noExit: true },
                    "",
                    window.location.href
                );

                return;
            }

            window.history.pushState(
                { noExit: true },
                "",
                window.location.href
            );
        };

        window.addEventListener(
            "popstate",
            handlePopState
        );

        return () => {
            window.removeEventListener(
                "popstate",
                handlePopState
            );
        };
    }, [onBack]);
}