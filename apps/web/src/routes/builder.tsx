import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState, useEffect } from "react";
import { PrinterViewer } from "@/components/viewer/PrinterViewer";
import { RobotBuilderSim } from "@/components/viewer/RobotBuilderSim";
import { exportRobotAsFBX } from "@/components/viewer/exportFbx";
import { Wrench, Plus, Trash2, Bot, Download } from "lucide-react";

export const Route = createFileRoute("/builder")({
    component: BuilderPage,
});

function BuilderPage() {
    const bots = useQuery(trpc.bots.list.queryOptions());
    const createBot = useMutation(trpc.bots.create.mutationOptions());
    const deleteBot = useMutation(trpc.bots.remove.mutationOptions());
    const updateSpecs = useMutation(trpc.bots.updateSpecs.mutationOptions());
    const calibrate = useMutation(trpc.bots.calibratePrinter.mutationOptions());
    const nameRef = useRef<HTMLInputElement | null>(null);
    const descRef = useRef<HTMLInputElement | null>(null);

    const onCreate = useCallback(async () => {
        const name = nameRef.current?.value.trim() || "";
        const description = descRef.current?.value.trim() || undefined;
        if (!name) return;
        const id = crypto.randomUUID();
        await createBot.mutateAsync({ id, name, description });
        nameRef.current!.value = "";
        if (descRef.current) descRef.current.value = "";
        await bots.refetch();
    }, [createBot, bots]);

    const onDelete = useCallback(
        async (id: string) => {
            await deleteBot.mutateAsync({ id });
            await bots.refetch();
        },
        [deleteBot, bots],
    );

    return (
        <div className="container mx-auto max-w-7xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Wrench className="h-8 w-8 text-primary" />
                        Robot Builder
                    </h1>
                    <p className="text-muted-foreground mt-1">Design and configure your BORTtheBOT robots</p>
                </div>
                <Badge variant="secondary">{bots.data?.length || 0} Robots</Badge>
            </div>

            {/* Create New Bot Section */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Plus className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Create New Robot</h2>
                </div>
                <Separator className="mb-4" />
                <div className="flex flex-wrap items-center gap-3">
                    <Input ref={nameRef} placeholder="Robot name" className="w-64" />
                    <Input ref={descRef} placeholder="Description (optional)" className="w-80" />
                    <Button onClick={onCreate} disabled={createBot.isPending}>
                        {createBot.isPending ? (
                            <>Creating...</>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Robot
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* Robots Grid */}
            {bots.data?.length ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {bots.data.map((b) => (
                        <RobotCard
                            key={b.id}
                            bot={b}
                            onDelete={onDelete}
                            updateSpecs={updateSpecs}
                            calibrate={calibrate}
                            bots={bots}
                        />
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Robots Yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Create your first robot to get started with BORTtheBOT
                    </p>
                    <Button onClick={onCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Robot
                    </Button>
                </Card>
            )}
        </div>
    );
}

function RobotCard({
    bot,
    onDelete,
    updateSpecs,
    calibrate,
    bots,
}: {
    bot: any;
    onDelete: (id: string) => Promise<void>;
    updateSpecs: any;
    calibrate: any;
    bots: any;
}) {
    const [selectedTab, setSelectedTab] = useState("overview");

    return (
        <Card className="flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">{bot.name}</h3>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(bot.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                {bot.description && (
                    <p className="text-sm text-muted-foreground">{bot.description}</p>
                )}
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
                <TabsList className="mx-4 mt-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="printer">Printer</TabsTrigger>
                    <TabsTrigger value="program">Program</TabsTrigger>
                    <TabsTrigger value="export">Export</TabsTrigger>
                </TabsList>

                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    <TabsContent value="overview" className="space-y-4 mt-4">
                        <div>
                            <h4 className="font-medium mb-2">3D Printer Viewer</h4>
                            <PrinterViewer 
                                specs={bot.specs.printer} 
                                calibration={calibrate.data as any} 
                            />
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-medium mb-2">Robot Build Simulation</h4>
                            <RobotBuilderSim
                                plateSizeCm={{ 
                                    w: bot.specs.printer.basePlateMm.w / 10, 
                                    d: bot.specs.printer.basePlateMm.d / 10 
                                }}
                                enclosureHeightCm={bot.specs.printer.enclosureCm.h}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="printer" className="mt-4">
                        <PrinterEditor
                            botId={bot.id}
                            specs={bot.specs}
                            onSave={async (specs) => {
                                await updateSpecs.mutateAsync({ id: bot.id, specs });
                                await bots.refetch();
                            }}
                            onCalibrate={async () => {
                                const res = await calibrate.mutateAsync({ id: bot.id });
                                alert(
                                    res.ok
                                        ? `Calibrated. Safe: ${res.safe}. Margins (cm): w=${res.marginsCm.w.toFixed(2)}, d=${
                                                res.marginsCm.d.toFixed(2)
                                            }`
                                        : "Calibration failed",
                                );
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="program" className="mt-4">
                        <ProgramEditor botId={bot.id} />
                    </TabsContent>

                    <TabsContent value="export" className="mt-4 space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Export Options</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Export your robot model and program files
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={() =>
                                        exportRobotAsFBX(
                                            {
                                                plateSizeCm: {
                                                    w: bot.specs.printer.basePlateMm.w / 10,
                                                    d: bot.specs.printer.basePlateMm.d / 10,
                                                },
                                                enclosureHeightCm: bot.specs.printer.enclosureCm.h,
                                            },
                                            `${bot.name.replace(/\s+/g, "_")}.fbx`,
                                        )
                                    }
                                    className="w-full"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export FBX Model
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </Card>
    );
}

type Specs = {
    type: string;
    version: string;
    printer: {
        enclosureCm: { w: number; h: number; d: number };
        basePlateMm: { w: number; d: number; h: number };
        downwardLasers: { count: 8; footprintCm: { w: number; d: number; h: number } };
        roofSphere: { grid: [9, 9, 9]; singleEmitterSizeCm: { w: number; h: number; d: number } };
    };
};

function PrinterEditor({
    botId,
    specs,
    onSave,
    onCalibrate,
}: {
    botId: string;
    specs: Specs;
    onSave: (specs: Specs) => Promise<void>;
    onCalibrate: () => Promise<void>;
}) {
    const [local, setLocal] = useState<Specs>(specs);

    const set = (path: (s: Specs) => any, value: number) => {
        setLocal((prev) => {
            const copy: Specs = JSON.parse(JSON.stringify(prev));
            // super light path setter for known fields
            path(copy);
            return copy;
        });
    };

    return (
        <div className="rounded-md border p-2 text-xs">
            <div className="mb-2 font-medium">Printer</div>
            <div className="grid grid-cols-2 gap-2">
                <Field label="Enclosure (cm) W" value={local.printer.enclosureCm.w} onChange={(v) => setLocal({ ...local, printer: { ...local.printer, enclosureCm: { ...local.printer.enclosureCm, w: v } } })} />
                <Field label="Enclosure (cm) H" value={local.printer.enclosureCm.h} onChange={(v) => setLocal({ ...local, printer: { ...local.printer, enclosureCm: { ...local.printer.enclosureCm, h: v } } })} />
                <Field label="Enclosure (cm) D" value={local.printer.enclosureCm.d} onChange={(v) => setLocal({ ...local, printer: { ...local.printer, enclosureCm: { ...local.printer.enclosureCm, d: v } } })} />

                <Field label="Base Plate (mm) W" value={local.printer.basePlateMm.w} onChange={(v) => setLocal({ ...local, printer: { ...local.printer, basePlateMm: { ...local.printer.basePlateMm, w: v } } })} />
                <Field label="Base Plate (mm) D" value={local.printer.basePlateMm.d} onChange={(v) => setLocal({ ...local, printer: { ...local.printer, basePlateMm: { ...local.printer.basePlateMm, d: v } } })} />
                <Field label="Base Plate (mm) H" value={local.printer.basePlateMm.h} onChange={(v) => setLocal({ ...local, printer: { ...local.printer, basePlateMm: { ...local.printer.basePlateMm, h: v } } })} />

                <Field label="Downward Footprint (cm) W" value={local.printer.downwardLasers.footprintCm.w} onChange={(v) => setLocal({ ...local, printer: { ...local.printer, downwardLasers: { ...local.printer.downwardLasers, footprintCm: { ...local.printer.downwardLasers.footprintCm, w: v } } } })} />
                <Field label="Downward Footprint (cm) D" value={local.printer.downwardLasers.footprintCm.d} onChange={(v) => setLocal({ ...local, printer: { ...local.printer, downwardLasers: { ...local.printer.downwardLasers, footprintCm: { ...local.printer.downwardLasers.footprintCm, d: v } } } })} />
                <Field label="Downward Footprint (cm) H" value={local.printer.downwardLasers.footprintCm.h} onChange={(v) => setLocal({ ...local, printer: { ...local.printer, downwardLasers: { ...local.printer.downwardLasers, footprintCm: { ...local.printer.downwardLasers.footprintCm, h: v } } } })} />

                <Field label="Roof Sphere Emitter W (cm)" value={local.printer.roofSphere.singleEmitterSizeCm.w} onChange={(v) => setLocal({ ...local, printer: { ...local.printer, roofSphere: { ...local.printer.roofSphere, singleEmitterSizeCm: { ...local.printer.roofSphere.singleEmitterSizeCm, w: v } } } })} />
                <Field label="Roof Sphere Emitter H (cm)" value={local.printer.roofSphere.singleEmitterSizeCm.h} onChange={(v) => setLocal({ ...local, printer: { ...local.printer, roofSphere: { ...local.printer.roofSphere, singleEmitterSizeCm: { ...local.printer.roofSphere.singleEmitterSizeCm, h: v } } } })} />
                <Field label="Roof Sphere Emitter D (cm)" value={local.printer.roofSphere.singleEmitterSizeCm.d} onChange={(v) => setLocal({ ...local, printer: { ...local.printer, roofSphere: { ...local.printer.roofSphere, singleEmitterSizeCm: { ...local.printer.roofSphere.singleEmitterSizeCm, d: v } } } })} />
            </div>
            <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => onSave(local)}>Save Specs</Button>
                <Button size="sm" variant="secondary" onClick={() => onCalibrate()}>Calibrate</Button>
            </div>
        </div>
    );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <label className="flex items-center gap-2">
            <span className="w-56">{label}</span>
            <input
                className="w-28 rounded border bg-transparent px-2 py-1"
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </label>
    );
}

// # UPDATED: Python program editor with loading existing programs
function ProgramEditor({ botId }: { botId: string }) {
    const programsQuery = useQuery(trpc.programs.listByBot.queryOptions({ botId }));
    const existingProgram = programsQuery.data?.[0];
    const [programId, setProgramId] = useState<string>(() => existingProgram?.id ?? crypto.randomUUID());
    
    // # ADDED: Load existing program code or use default boilerplate
    const defaultCode = `# BORTtheBOT Robot Program
# Robot ID: ${botId}

def main():
    print("Starting BORTtheBOT Robot Program")
    # Add your robot control code here
    pass

if __name__ == "__main__":
    main()
`;
    const [code, setCode] = useState(defaultCode);
    
    // # ADDED: Load existing program when it's fetched
    useEffect(() => {
        if (existingProgram?.code) {
            setCode(existingProgram.code);
            setProgramId(existingProgram.id);
        }
    }, [existingProgram]);
    
    const upsert = useMutation(trpc.programs.upsert.mutationOptions());
    const createToken = useMutation(trpc.programs.createDownloadToken.mutationOptions());
    const removeProgram = useMutation(trpc.programs.remove.mutationOptions());

    const onSave = async () => {
        await upsert.mutateAsync({ id: programId, botId, language: "python", code });
        await programsQuery.refetch();
        alert("Program saved successfully!");
    };
    
    const onDownload = async () => {
        // Save first, then download
        await upsert.mutateAsync({ id: programId, botId, language: "python", code });
        const { token } = await createToken.mutateAsync({ id: programId });
        window.location.href = `${import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000"}/programs/${token}`;
    };
    
    const onDelete = async () => {
        if (existingProgram && confirm("Delete this program?")) {
            await removeProgram.mutateAsync({ id: programId });
            setCode(defaultCode);
            await programsQuery.refetch();
        }
    };

    return (
        <div className="mt-2 rounded-md border p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Program (Python)</div>
                {existingProgram && (
                    <Badge variant="outline" className="text-xs">
                        Saved {new Date(existingProgram.updatedAt).toLocaleDateString()}
                    </Badge>
                )}
            </div>
            <textarea
                className="h-64 w-full resize-y rounded border bg-transparent p-3 text-xs font-mono"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your Python program code here..."
            />
            <div className="flex gap-2">
                <Button size="sm" onClick={onSave} disabled={upsert.isPending}>
                    {upsert.isPending ? "Saving..." : "Save Program"}
                </Button>
                <Button size="sm" variant="secondary" onClick={onDownload} disabled={createToken.isPending}>
                    <Download className="h-3 w-3 mr-1" />
                    Download .py
                </Button>
                {existingProgram && (
                    <Button size="sm" variant="destructive" onClick={onDelete} disabled={removeProgram.isPending}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                    </Button>
                )}
            </div>
            {programsQuery.isLoading && (
                <p className="text-xs text-muted-foreground">Loading program...</p>
            )}
        </div>
    );
}

