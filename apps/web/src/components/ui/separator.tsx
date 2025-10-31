"use client";
// # ADDED: Separator component
import { cn } from "@/lib/utils";

export function Separator({
    orientation = "horizontal",
    className,
}: {
    orientation?: "horizontal" | "vertical";
    className?: string;
}) {
    return (
        <div
            className={cn(
                "shrink-0 bg-border",
                orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
                className
            )}
        />
    );
}

