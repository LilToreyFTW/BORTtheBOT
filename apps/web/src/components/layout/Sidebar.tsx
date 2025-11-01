"use client";
// # ADDED: Modular sidebar navigation component
import { Link, useLocation } from "@tanstack/react-router";
import { 
    Home, 
    LayoutDashboard, 
    Wrench, 
    Store, 
    Settings, 
    Code, 
    Bot,
    FileText,
    Package,
    Factory
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { 
        icon: Home, 
        label: "Home", 
        to: "/", 
        description: "Main landing page"
    },
    { 
        icon: LayoutDashboard, 
        label: "Dashboard", 
        to: "/dashboard", 
        description: "Overview and statistics"
    },
    { 
        icon: Wrench, 
        label: "Robot Builder", 
        to: "/builder", 
        description: "Build and configure robots"
    },
    { 
        icon: Factory, 
        label: "3D Array Viewer", 
        to: "/array-viewer", 
        description: "View 8-printer industrial array"
    },
    { 
        icon: Code, 
        label: "Programs", 
        to: "/programs", 
        description: "Manage robot programs"
    },
    { 
        icon: Package, 
        label: "Components", 
        to: "/components", 
        description: "Robot component library"
    },
    { 
        icon: Store, 
        label: "Store", 
        to: "/store", 
        description: "Purchase components"
    },
    { 
        icon: Settings, 
        label: "Settings", 
        to: "/settings", 
        description: "Application settings"
    },
] as const;

export function Sidebar({ className }: { className?: string }) {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <aside className={cn("w-64 border-r bg-background flex flex-col", className)}>
            <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">BORTtheBOT</h1>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Robot Builder Suite</p>
            </div>
            
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.to;
                    
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                "hover:bg-accent hover:text-accent-foreground",
                                isActive 
                                    ? "bg-accent text-accent-foreground" 
                                    : "text-muted-foreground"
                            )}
                            title={item.description}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
            
            <div className="p-4 border-t">
                <div className="text-xs text-muted-foreground">
                    <div>Version 1.0.0</div>
                    <div className="mt-1">© 2024 BORTtheBOT</div>
                </div>
            </div>
        </aside>
    );
}

