"use client";

import { useEffect, useRef } from "react";

// export function usePreventExit(onBack?: () => boolean | void) {
//     useEffect(() => {
//         window.history.pushState({ noExit: true }, "", window.location.href);
//         const handlePopState = () => {
//             const handled = onBack?.();
//             if (handled) {
//                 window.history.pushState({ noExit: true }, "", window.location.href);
//                 return;
//             }
//             window.history.pushState({ noExit: true }, "", window.location.href);
//         };

//         window.addEventListener("popstate", handlePopState);

//         return () => {
//             window.removeEventListener("popstate", handlePopState);
//         };
//     }, [onBack]);
// }

export function usePreventExit(
    canGoBack: boolean,
    onBack: () => boolean | void
) {
    const callbackRef = useRef(onBack);

    callbackRef.current = onBack;

    // push history khi mở layer mới
    useEffect(() => {
        if (!canGoBack) return;

        window.history.pushState(
            { drawer: true },
            ""
        );
    }, [canGoBack]);

    useEffect(() => {
        const handlePopState = () => {
            const handled =
                callbackRef.current?.();

            // nếu đã handle drawer close
            // thì push lại để giữ user ở page hiện tại
            if (handled) {
                window.history.pushState(
                    { drawer: true },
                    ""
                );
            }
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
    }, []);
}
