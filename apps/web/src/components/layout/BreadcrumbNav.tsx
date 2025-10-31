"use client";
// # ADDED: Breadcrumb navigation component
import { useLocation, Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export function BreadcrumbNav() {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter((x) => x);
    
    // Map route paths to friendly names
    const routeNames: Record<string, string> = {
        dashboard: "Dashboard",
        builder: "Robot Builder",
        programs: "Programs",
        components: "Components",
        store: "Store",
        settings: "Settings",
    };
    
    if (pathnames.length === 0) {
        return null;
    }
    
    return (
        <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <Link 
                to="/" 
                className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4" />
            </Link>
            {pathnames.map((path, index) => {
                const isLast = index === pathnames.length - 1;
                const routePath = "/" + pathnames.slice(0, index + 1).join("/");
                const displayName = routeNames[path] || path.charAt(0).toUpperCase() + path.slice(1);
                
                return (
                    <div key={path} className="flex items-center gap-1">
                        <ChevronRight className="h-4 w-4" />
                        {isLast ? (
                            <span className="text-foreground font-medium">{displayName}</span>
                        ) : (
                            <Link 
                                to={routePath}
                                className="hover:text-foreground transition-colors"
                            >
                                {displayName}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}

