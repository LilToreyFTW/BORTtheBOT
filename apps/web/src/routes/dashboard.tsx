import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Bot, Wrench, Code, Activity, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/dashboard")({
    component: DashboardPage,
});

function DashboardPage() {
    const bots = useQuery(trpc.bots.list.queryOptions());
    const healthCheck = useQuery(trpc.healthCheck.queryOptions());

    const stats = {
        totalBots: bots.data?.length || 0,
        activePrograms: 0, // Could be calculated from programs
        totalCalibrations: 0,
        systemHealth: healthCheck.data ? "operational" : "degraded",
    };

    const recentBots = bots.data?.slice(0, 5) || [];

    return (
        <div className="container mx-auto max-w-7xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your BORTtheBOT system</p>
                </div>
                <Badge variant={stats.systemHealth === "operational" ? "success" : "destructive"}>
                    {stats.systemHealth === "operational" ? "System Operational" : "System Issues"}
                </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Robots</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalBots}</p>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Bot className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-muted-foreground">All systems active</span>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Programs</p>
                            <p className="text-3xl font-bold mt-2">{stats.activePrograms}</p>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Code className="h-6 w-6 text-blue-500" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Calibrations</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalCalibrations}</p>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Wrench className="h-6 w-6 text-purple-500" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">System Status</p>
                            <p className="text-3xl font-bold mt-2 capitalize">{stats.systemHealth}</p>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Activity className="h-6 w-6 text-green-500" />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Robots */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Recent Robots</h2>
                        <Badge variant="secondary">{recentBots.length}</Badge>
                    </div>
                    <Separator className="mb-4" />
                    {recentBots.length > 0 ? (
                        <div className="space-y-3">
                            {recentBots.map((bot) => (
                                <div
                                    key={bot.id}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                                >
                                    <div>
                                        <p className="font-medium">{bot.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {bot.description || "No description"}
                                        </p>
                                    </div>
                                    <Badge variant="outline">
                                        {new Date(bot.createdAt).toLocaleDateString()}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No robots yet</p>
                            <p className="text-sm mt-1">Create your first robot in the Builder</p>
                        </div>
                    )}
                </Card>

                {/* Quick Actions */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <Separator className="mb-4" />
                    <div className="grid grid-cols-2 gap-3">
                        <ActionCard
                            icon={Wrench}
                            title="Build Robot"
                            description="Create a new robot"
                            href="/builder"
                        />
                        <ActionCard
                            icon={Code}
                            title="Write Program"
                            description="Code your robot"
                            href="/programs"
                        />
                        <ActionCard
                            icon={Bot}
                            title="View All"
                            description="See all robots"
                            href="/builder"
                        />
                        <ActionCard
                            icon={Activity}
                            title="Monitor"
                            description="System health"
                            href="/dashboard"
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function ActionCard({
    icon: Icon,
    title,
    description,
    href,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    href: string;
}) {
    return (
        <a
            href={href}
            className="p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
        >
            <Icon className="h-6 w-6 mb-2 text-primary" />
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </a>
    );
}
