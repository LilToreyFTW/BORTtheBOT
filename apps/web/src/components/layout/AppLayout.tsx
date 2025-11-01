"use client";
// # ADDED: Main application layout with sidebar
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

export function AppLayout({ 
    children, 
    showSidebar = true,
    className 
}: { 
    children: React.ReactNode;
    showSidebar?: boolean;
    className?: string;
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            {showSidebar && <Sidebar />}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className={cn("flex-1 overflow-y-auto bg-background", className)}>
                    {children}
                </main>
            </div>
        </div>
    );
}

