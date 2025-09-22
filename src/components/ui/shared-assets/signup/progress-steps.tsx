"use client";

import { cx } from "@/utils/cx";

export type Item = { title: string; description: string; connector?: boolean; status: "incomplete" | "current" | "complete" };

export interface ProgressIconsCenteredProps {
    size?: "sm" | "md";
    connector?: boolean;
    items: Item[];
}

export const statuses = {
    incomplete: "bg-transparent ring-[1.5px] ring-inset ring-brand",
    current: "bg-brand-solid ring-2 ring-focus-ring ring-offset-2",
    complete: "bg-brand-solid",
};

export const IconOnly = ({ status = "incomplete", size = "sm" }: { status: "incomplete" | "current" | "complete"; size: "sm" | "md" }) => {
    return (
        <span className={cx("z-10 flex items-center justify-center rounded-full", statuses[status], size === "sm" ? "size-6" : "size-8")}>
            <span
                className={cx(
                    "rounded-full bg-border-brand",
                    size === "sm" ? "size-2" : "size-2.5",
                    status === "complete" && "hidden",
                    status === "current" && "bg-fg-white",
                )}
            />

            {/* Tick icon. */}
            <svg
                width="13"
                height="11"
                viewBox="0 0 13 11"
                fill="none"
                className={cx("hidden", status === "complete" && "block", size === "sm" ? "h-auto w-auto" : "h-3.5 w-4")}
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.0964 0.390037L3.93638 7.30004L2.03638 5.27004C1.68638 4.94004 1.13638 4.92004 0.736381 5.20004C0.346381 5.49004 0.236381 6.00004 0.476381 6.41004L2.72638 10.07C2.94638 10.41 3.32638 10.62 3.75638 10.62C4.16638 10.62 4.55638 10.41 4.77638 10.07C5.13638 9.60004 12.0064 1.41004 12.0064 1.41004C12.9064 0.490037 11.8164 -0.319963 11.0964 0.380037V0.390037Z"
                    fill="white"
                />
            </svg>
        </span>
    );
};

export const IconLeft = ({ status = "incomplete", connector = true, size = "sm", ...rest }: Item & { size: "sm" | "md" }) => {
    return (
        <div className={cx("group flex h-max flex-row items-start justify-start gap-4", size === "sm" && "gap-3")}>
            <div className="flex flex-col items-center gap-1 self-stretch pb-1">
                <IconOnly size={size} status={status} />
                <span className={cx("flex-1 rounded-xs border-l-2 border-brand", !connector && "hidden")} />
            </div>
            <div className={cx("flex flex-col items-start", size === "sm" ? "pt-0.5 not-group-last:pb-6" : "pt-1 not-group-last:pb-8")}>
                <p className={cx(size === "sm" ? "text-sm font-semibold" : "text-md font-semibold", "text-primary_on-brand")}>{rest.title}</p>
                <p className={cx(size === "sm" ? "text-sm" : "text-md", "text-tertiary_on-brand")}>{rest.description}</p>
            </div>
        </div>
    );
};

export const ProgressIconsWithText = ({ size = "sm", connector = true, items }: ProgressIconsCenteredProps) => {
    return (
        <div className="grid w-full grid-cols-1 items-start justify-start">
            {items.map((item, index) => {
                return <IconLeft key={index} {...item} size={size} connector={!connector ? false : item.connector || index !== items.length - 1} />;
            })}
        </div>
    );
};
