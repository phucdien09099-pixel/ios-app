// components/common/AppPullToRefresh.tsx
"use client";

import PullToRefresh from "react-simple-pull-to-refresh";
import { HugeiconsIcon } from "@hugeicons/react";
import { ReloadIcon } from "@hugeicons/core-free-icons";
import { ReactNode } from "react";

type Props = {
    children: ReactNode;
    onRefresh: () => Promise<void>;
    className?: string;
};

export default function AppPullToRefresh({
    children,
    onRefresh,
    className,
}: Props) {
    return (
        <PullToRefresh
            className={className}
            pullingContent={<></>}
            refreshingContent={
                <div className="flex justify-center py-2">
                    <HugeiconsIcon
                        className="animate-spin"
                        icon={ReloadIcon}
                    />
                </div>
            }
            maxPullDownDistance={67}
            resistance={1}
            canFetchMore
            pullDownThreshold={67}
            onRefresh={onRefresh}
        >
            {children}
        </PullToRefresh>
    );
}