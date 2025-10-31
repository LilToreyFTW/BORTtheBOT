"use client";
// # ADDED: Enhanced header component with breadcrumbs and quick actions
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { Bell, Search, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BreadcrumbNav } from "./BreadcrumbNav";

export function Header({ showSidebar = true }: { showSidebar?: boolean }) {
    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
                {!showSidebar && (
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-semibold">BORTtheBOT</h1>
                    </div>
                )}
                
                <div className="flex-1 max-w-md mx-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search robots, programs..."
                            className="pl-8 w-full"
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <BreadcrumbNav />
                    <Button variant="ghost" size="icon" title="Notifications">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Help">
                        <HelpCircle className="h-5 w-5" />
                    </Button>
                    <ModeToggle />
                    <UserMenu />
                </div>
            </div>
        </header>
    );
}

