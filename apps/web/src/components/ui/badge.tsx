"use client";
// # ADDED: Badge component for labels and status indicators
import { cn } from "@/lib/utils";

export function Badge({
    children,
    variant = "default",
    className,
}: {
    children: React.ReactNode;
    variant?: "default" | "secondary" | "destructive" | "outline" | "success";
    className?: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                {
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80": variant === "default",
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80": variant === "destructive",
                    "text-foreground": variant === "outline",
                    "border-transparent bg-green-500 text-white hover:bg-green-600": variant === "success",
                },
                className
            )}
        >
            {children}
        </span>
    );
}

