import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

export const Route = createFileRoute("/builder")({
    component: BuilderPage,
});

function BuilderPage() {
    const bots = useQuery(trpc.bots.list.queryOptions());
    const createBot = useMutation(trpc.bots.create.mutationOptions());
    const deleteBot = useMutation(trpc.bots.remove.mutationOptions());
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
                                <div className="rounded-md border p-2 text-xs">
                                    Specs: <pre className="whitespace-pre-wrap">{JSON.stringify(b.specs, null, 2)}</pre>
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

