"use client";
// # ADDED: disable prerendering to avoid QueryClientProvider requirement during build
export const dynamic = "force-dynamic";
import { useMutation, useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
// # UPDATED VERSION: (commented) fix import path for AppRouter using direct workspace source path
// import type { AppRouter as AppRouterFixed } from "../../../../packages/api/src/routers";
// # UPDATED VERSION: limit React imports to used APIs
// import { useEffect, useMemo, useRef, useState } from "react";
import { useRef } from "react";
// # UPDATED VERSION: avoid name clash with exported `dynamic`
// import dynamic from "next/dynamic";
import NextDynamic from "next/dynamic";

// # UPDATED VERSION: commenting unused dynamic imports
// const PrinterViewer = NextDynamic(() => import("../../components/PrinterViewerWrapper").then(m => m.PrinterViewerWrapper), { ssr: false });
// const RobotBuilderSim = NextDynamic(() => import("../../components/RobotSimWrapper").then(m => m.RobotSimWrapper), { ssr: false });

/* # UPDATED VERSION: Corrected relative paths for dynamic imports */
const PrinterViewer2 = NextDynamic(
  () => import("../components/PrinterViewerWrapper").then((m) => m.PrinterViewerWrapper),
  { ssr: false }
);
const RobotBuilderSim2 = NextDynamic(
  () => import("../components/RobotSimWrapper").then((m) => m.RobotSimWrapper),
  { ssr: false }
);

// # UPDATED VERSION: relax client typing to avoid cross-package type resolution issues
const client = createTRPCClient<any>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000"}/trpc`,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: "include" });
      },
    }),
  ],
});

// # UPDATED VERSION: simplify types to string-based paths
function useTRPCQuery<TPath extends string>(path: TPath, input?: any) {
  return useQuery({
    queryKey: ["trpc", path, input],
    queryFn: () => (client as any).query(path, input),
  });
}
// # UPDATED VERSION: simplify types to string-based paths
function useTRPCMutation<TPath extends string>(path: TPath) {
  return useMutation({
    mutationFn: (input: any) => (client as any).mutation(path, input),
  });
}

// # ADDED: split content into a child component so hooks render under Provider
function BuilderContent() {
  const bots = useTRPCQuery("bots.list");
  const createBot = useTRPCMutation("bots.create");
  const removeBot = useTRPCMutation("bots.remove");
  const updateSpecs = useTRPCMutation("bots.updateSpecs");
  const calibrate = useTRPCMutation("bots.calibratePrinter");

  const nameRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLInputElement | null>(null);

  const onCreate = async () => {
    const name = nameRef.current?.value?.trim() || "";
    const description = descRef.current?.value?.trim() || undefined;
    if (!name) return;
    const id = crypto.randomUUID();
    await createBot.mutateAsync({ id, name, description });
    if (nameRef.current) nameRef.current.value = "";
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
              {/* # UPDATED VERSION: Use corrected component import */}
              <PrinterViewer2 bot={b} onSave={async (specs: any) => { await updateSpecs.mutateAsync({ id: b.id, specs }); await bots.refetch(); }} onCalibrate={async () => calibrate.mutateAsync({ id: b.id })} calibration={calibrate.data as any} />
            </div>
            <div style={{ marginTop: 8 }}>
              {/* # UPDATED VERSION: Use corrected component import */}
              <RobotBuilderSim2 plateW={b.specs.printer.basePlateMm.w/10} plateD={b.specs.printer.basePlateMm.d/10} height={b.specs.printer.enclosureCm.h} botName={b.name} />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

export default function BuilderPage() {
  // # ADDED: local QueryClient to satisfy provider during prerender
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BuilderContent />
    </QueryClientProvider>
  );
}


