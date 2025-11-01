import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Code, Download, Save, Plus, FileCode, Edit, Eye } from "lucide-react";

export const Route = createFileRoute("/programs")({
    component: ProgramsPage,
});

function ProgramsPage() {
    const bots = useQuery(trpc.bots.list.queryOptions());
    const navigate = useNavigate();
    const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
    const [viewProgram, setViewProgram] = useState<{ id: string; botId: string; code: string; language: string } | null>(null);
    const createDownloadToken = useMutation(trpc.programs.createDownloadToken.mutationOptions());

    return (
        <div className="container mx-auto max-w-7xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Programs</h1>
                    <p className="text-muted-foreground mt-1">Manage Python programs for your robots</p>
                </div>
                <Button onClick={() => navigate({ to: "/builder" })}>
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
                            <ProgramCard 
                                key={bot.id} 
                                botId={bot.id} 
                                botName={bot.name}
                                onView={(program) => setViewProgram(program)}
                            />
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
                                <ProgramCard 
                                    botId={bot.id} 
                                    botName={bot.name} 
                                    compact
                                    onView={(program) => setViewProgram(program)}
                                />
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
            
            {/* # ADDED: View Program Modal */}
            {viewProgram && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-4xl w-full max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-semibold">View Program</h2>
                                <Button variant="ghost" size="sm" onClick={() => setViewProgram(null)}>×</Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Program for robot: {bots.data?.find(b => b.id === viewProgram.botId)?.name || "Unknown"}
                            </p>
                        </div>
                        <div className="p-6 space-y-4 flex-1 overflow-auto">
                            <div className="flex items-center gap-2">
                                <Badge>{viewProgram.language}</Badge>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        if (!viewProgram) return;
                                        const { token } = await createDownloadToken.mutateAsync({ id: viewProgram.id });
                                        window.location.href = `${import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000"}/programs/${token}`;
                                    }}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                        navigate({ to: "/builder" });
                                        setViewProgram(null);
                                    }}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit in Builder
                                </Button>
                            </div>
                            <textarea
                                value={viewProgram.code}
                                readOnly
                                className="w-full h-[50vh] font-mono text-sm p-4 rounded border bg-muted resize-none"
                            />
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

function ProgramCard({ 
    botId, 
    botName, 
    compact = false,
    onView 
}: { 
    botId: string; 
    botName: string; 
    compact?: boolean;
    onView?: (program: { id: string; botId: string; code: string; language: string }) => void;
}) {
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
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                                if (program) {
                                    const programData = {
                                        id: program.id,
                                        botId: botId,
                                        code: program.code,
                                        language: program.language,
                                    };
                                    if (onView) {
                                        onView(programData);
                                    } else {
                                        window.location.href = "/builder";
                                    }
                                } else {
                                    window.location.href = "/builder";
                                }
                            }}
                        >
                            {program ? (
                                <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                </>
                            ) : (
                                <>
                                    <Code className="h-4 w-4 mr-2" />
                                    Create
                                </>
                            )}
                        </Button>
                        {program && (
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                <Download className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </>
            )}
        </Card>
    );
}

function TemplateCard({ title, description, language }: { title: string; description: string; language: string }) {
    const navigate = useNavigate();
    const templates: Record<string, string> = {
        "Basic Movement": `# Basic Movement Template
# Robot ID: [BOT_ID]

def main():
    print("Starting basic movement sequence")
    # Add movement commands here
    # Example: move_forward(100)
    # Example: turn_left(90)
    pass

if __name__ == "__main__":
    main()
`,
        "Sensor Reading": `# Sensor Reading Template
# Robot ID: [BOT_ID]

def read_sensors():
    """Read all sensors and return data"""
    # Add sensor reading code here
    sensor_data = {}
    # Example: sensor_data['temperature'] = read_temperature()
    return sensor_data

def main():
    print("Reading sensors...")
    data = read_sensors()
    print(f"Sensor data: {data}")

if __name__ == "__main__":
    main()
`,
        "Advanced Control": `# Advanced Control Template
# Robot ID: [BOT_ID]

class RobotController:
    def __init__(self):
        self.position = [0, 0, 0]
        self.orientation = 0
    
    def move(self, x, y, z):
        """Move robot to specified coordinates"""
        self.position = [x, y, z]
        print(f"Moving to: {self.position}")
    
    def calibrate(self):
        """Calibrate robot systems"""
        print("Calibrating...")
        # Add calibration logic
        return True

def main():
    controller = RobotController()
    controller.calibrate()
    controller.move(100, 100, 0)

if __name__ == "__main__":
    main()
`,
    };
    
    const handleUseTemplate = () => {
        // Navigate to builder - user can create a bot and use the template
        navigate({ to: "/builder" });
    };
    
    return (
        <Card className="p-4 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{title}</h3>
                <Badge>{language}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <Button variant="outline" size="sm" className="w-full" onClick={handleUseTemplate}>
                Use Template
            </Button>
        </Card>
    );
}
