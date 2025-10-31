"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@project/api/routers";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

const PrinterViewer = dynamic(() => import("../../components/PrinterViewerWrapper").then(m => m.PrinterViewerWrapper), { ssr: false });
const RobotBuilderSim = dynamic(() => import("../../components/RobotSimWrapper").then(m => m.RobotSimWrapper), { ssr: false });

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000"}/trpc`,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: "include" });
      },
    }),
  ],
});

function useTRPCQuery<TPath extends keyof AppRouter["_def"]["queries"] & string>(path: TPath, input?: any) {
  return useQuery({
    queryKey: ["trpc", path, input],
    queryFn: () => (client as any).query(path, input),
  });
}
function useTRPCMutation<TPath extends keyof AppRouter["_def"]["mutations"] & string>(path: TPath) {
  return useMutation({
    mutationFn: (input: any) => (client as any).mutation(path, input),
  });
}

export default function BuilderPage() {
  const bots = useTRPCQuery("bots.list");
  const createBot = useTRPCMutation("bots.create");
  const removeBot = useTRPCMutation("bots.remove");
  const updateSpecs = useTRPCMutation("bots.updateSpecs");
  const calibrate = useTRPCMutation("bots.calibratePrinter");

  const nameRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLInputElement | null>(null);

  const onCreate = async () => {
    const name = nameRef.current?.value.trim() || "";
    const description = descRef.current?.value.trim() || undefined;
    if (!name) return;
    const id = crypto.randomUUID();
    await createBot.mutateAsync({ id, name, description });
    nameRef.current!.value = "";
    if (descRef.current) descRef.current.value = "";
    await bots.refetch();
  };

  const onDelete = async (id: string) => {
    await removeBot.mutateAsync({ id });
    await bots.refetch();
  };

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>BORT Command Center (Next)</h1>
      <section style={{ marginBottom: 12 }}>
        <input ref={nameRef} placeholder="Bot name" style={{ marginRight: 8 }} />
        <input ref={descRef} placeholder="Description" style={{ marginRight: 8 }} />
        <button onClick={onCreate}>Create</button>
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 12 }}>
        {bots.data?.map((b: any) => (
          <div key={b.id} style={{ border: "1px solid #333", borderRadius: 6, padding: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{b.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{b.description}</div>
              </div>
              <button onClick={() => onDelete(b.id)} style={{ color: "#ff5252" }}>Delete</button>
            </div>
            <div style={{ marginTop: 8 }}>
              <PrinterViewer bot={b} onSave={async (specs) => { await updateSpecs.mutateAsync({ id: b.id, specs }); await bots.refetch(); }} onCalibrate={async () => calibrate.mutateAsync({ id: b.id })} calibration={calibrate.data as any} />
            </div>
            <div style={{ marginTop: 8 }}>
              <RobotBuilderSim plateW={b.specs.printer.basePlateMm.w/10} plateD={b.specs.printer.basePlateMm.d/10} height={b.specs.printer.enclosureCm.h} botName={b.name} />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}


