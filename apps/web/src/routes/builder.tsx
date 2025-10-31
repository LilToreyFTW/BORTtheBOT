import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { PrinterViewer } from "@/components/viewer/PrinterViewer";
import { RobotBuilderSim } from "@/components/viewer/RobotBuilderSim";
import { exportRobotAsFBX } from "@/components/viewer/exportFbx";

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
        <div className="container mx-auto max-w-5xl px-4 py-4">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">BORT Command Center</h1>
                <Link to="/">Home</Link>
            </div>

            <section className="mb-4 rounded-lg border p-4">
                <h2 className="mb-2 font-medium">Create New Bot</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <Input ref={nameRef} placeholder="Bot name" className="w-60" />
                    <Input ref={descRef} placeholder="Description (optional)" className="w-80" />
                    <Button onClick={onCreate} disabled={createBot.isPending}>
                        {createBot.isPending ? "Creating..." : "Create"}
                    </Button>
                </div>
            </section>

            <section className="rounded-lg border p-3">
                <h2 className="mb-2 font-medium">Bots (Column Box)</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {bots.data?.length ? (
                        bots.data.map((b) => (
                            <Card key={b.id} className="flex flex-col gap-2 p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{b.name}</div>
                                        <div className="text-xs text-muted-foreground">{b.description}</div>
                                    </div>
                                    <Button variant="destructive" onClick={() => onDelete(b.id)}>
                                        Delete
                                    </Button>
                                </div>
                                <PrinterEditor botId={b.id} specs={b.specs} onSave={async (specs) => {
                                    await updateSpecs.mutateAsync({ id: b.id, specs });
                                    await bots.refetch();
                                }} onCalibrate={async () => {
                                    const res = await calibrate.mutateAsync({ id: b.id });
                                    alert(
                                        res.ok
                                            ? `Calibrated. Safe: ${res.safe}. Margins (cm): w=${res.marginsCm.w.toFixed(2)}, d=${
                                                    res.marginsCm.d.toFixed(2)
                                                }`
                                            : "Calibration failed",
                                    );
                                }} />
                                <PrinterViewer specs={b.specs.printer} calibration={calibrate.data as any} />
                                <RobotBuilderSim
                                    plateSizeCm={{ w: b.specs.printer.basePlateMm.w / 10, d: b.specs.printer.basePlateMm.d / 10 }}
                                    enclosureHeightCm={b.specs.printer.enclosureCm.h}
                                />
                                <ProgramEditor botId={b.id} />
                                <div className="mt-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            exportRobotAsFBX(
                                                {
                                                    plateSizeCm: {
                                                        w: b.specs.printer.basePlateMm.w / 10,
                                                        d: b.specs.printer.basePlateMm.d / 10,
                                                    },
                                                    enclosureHeightCm: b.specs.printer.enclosureCm.h,
                                                },
                                                `${b.name.replace(/\s+/g, "_")}.fbx`,
                                            )
                                        }
                                    >
                                        Export FBX
                                    </Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-sm text-muted-foreground">No bots yet. Create one above.</div>
                    )}
                </div>
            </section>
        </div>
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

// # ADDED: Minimal Python program editor and downloader
function ProgramEditor({ botId }: { botId: string }) {
    const [code, setCode] = useState("print('Hello from BORTtheBOT')\n");
    const [programId] = useState(() => crypto.randomUUID());
    const upsert = useMutation(trpc.programs.upsert.mutationOptions());
    const createToken = useMutation(trpc.programs.createDownloadToken.mutationOptions());

    const onSave = async () => {
        await upsert.mutateAsync({ id: programId, botId, language: "python", code });
        alert("Saved program");
    };
    const onDownload = async () => {
        await upsert.mutateAsync({ id: programId, botId, language: "python", code });
        const { token } = await createToken.mutateAsync({ id: programId });
        window.location.href = `${import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000"}/programs/${token}`;
    };

    return (
        <div className="mt-2 rounded-md border p-2">
            <div className="mb-1 text-xs font-medium">Program (Python)</div>
            <textarea
                className="h-32 w-full resize-y rounded border bg-transparent p-2 text-xs font-mono"
                value={code}
                onChange={(e) => setCode(e.target.value)}
            />
            <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={onSave}>Save Program</Button>
                <Button size="sm" variant="secondary" onClick={onDownload}>Download .py</Button>
            </div>
        </div>
    );
}

