import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Code, Download, Save, Plus, FileCode } from "lucide-react";

export const Route = createFileRoute("/programs")({
    component: ProgramsPage,
});

function ProgramsPage() {
    const bots = useQuery(trpc.bots.list.queryOptions());
    const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

    return (
        <div className="container mx-auto max-w-7xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Programs</h1>
                    <p className="text-muted-foreground mt-1">Manage Python programs for your robots</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Program
                </Button>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Programs</TabsTrigger>
                    <TabsTrigger value="by-bot">By Robot</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bots.data?.map((bot) => (
                            <ProgramCard key={bot.id} botId={bot.id} botName={bot.name} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="by-bot">
                    <div className="space-y-4">
                        {bots.data?.map((bot) => (
                            <Card key={bot.id} className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold">{bot.name}</h3>
                                        <p className="text-sm text-muted-foreground">{bot.description}</p>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        View Programs
                                    </Button>
                                </div>
                                <ProgramCard botId={bot.id} botName={bot.name} compact />
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="templates">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <TemplateCard
                            title="Basic Movement"
                            description="Simple robot movement template"
                            language="python"
                        />
                        <TemplateCard
                            title="Sensor Reading"
                            description="Read and process sensor data"
                            language="python"
                        />
                        <TemplateCard
                            title="Advanced Control"
                            description="Complex control algorithms"
                            language="python"
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ProgramCard({ botId, botName, compact = false }: { botId: string; botName: string; compact?: boolean }) {
    const programsQuery = useQuery({
        ...trpc.programs.listByBot.queryOptions({ botId }),
    });
    const createToken = useMutation(trpc.programs.createDownloadToken.mutationOptions());
    const program = programsQuery.data?.[0];

    const handleDownload = async () => {
        if (!program) return;
        const { token } = await createToken.mutateAsync({ id: program.id });
        window.location.href = `${import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000"}/programs/${token}`;
    };

    return (
        <Card className={`${compact ? "p-3" : "p-4"} flex flex-col`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-primary" />
                    <span className="font-medium">{botName}</span>
                </div>
                <Badge variant="secondary">Python</Badge>
            </div>
            {!compact && (
                <>
                    <p className="text-sm text-muted-foreground mb-4">
                        Robot program configuration
                    </p>
                    <div className="flex gap-2 mt-auto">
                        <Button variant="outline" size="sm" className="flex-1">
                            <Code className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </>
            )}
        </Card>
    );
}

function TemplateCard({ title, description, language }: { title: string; description: string; language: string }) {
    return (
        <Card className="p-4 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{title}</h3>
                <Badge>{language}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <Button variant="outline" size="sm" className="w-full">
                Use Template
            </Button>
        </Card>
    );
}
