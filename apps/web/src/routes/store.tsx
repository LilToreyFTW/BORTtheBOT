import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRef } from "react";

export const Route = createFileRoute("/store")({
    component: StorePage,
});

const plansDisplay = {
    basic: { label: "Basic", price: "$9.99" },
    pro: { label: "Pro", price: "$40.99" },
    yearly: { label: "Yearly", price: "$99.99" },
    lifetime: { label: "Lifetime", price: "$400.99" },
} as const;

function StorePage() {
    const plans = useQuery(trpc.billing.listPlans.queryOptions());
    const createCheckout = useMutation(trpc.billing.createCheckout.mutationOptions());
    const recordCash = useMutation(trpc.billing.recordCashApp.mutationOptions());
    const txRef = useRef<HTMLInputElement | null>(null);

    const ccSubscribe = async (planId: string) => {
        const res = await createCheckout.mutateAsync({
            planId,
            successUrl: window.location.origin + "/store?status=success",
            cancelUrl: window.location.origin + "/store?status=cancel",
        });
        if (res.url) window.location.href = res.url;
    };

    const cashSubmit = async (planId: string) => {
        const ref = txRef.current?.value.trim();
        if (!ref) return;
        await recordCash.mutateAsync({ planId, txRef: ref });
        alert("Submitted Cash App payment reference for review.");
        txRef.current!.value = "";
    };

    return (
        <div className="container mx-auto max-w-5xl px-4 py-4">
            <h1 className="mb-4 text-xl font-semibold">Store</h1>
            <p className="mb-4 text-sm text-muted-foreground">Pay with Credit Card (Stripe) or Cash App to $Toreyx2024.</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {plans.data?.map((p) => (
                    <Card key={p.id} className="flex flex-col gap-3 p-4">
                        <div>
                            <div className="text-lg font-medium">{plansDisplay[p.id as keyof typeof plansDisplay]?.label || p.name}</div>
                            <div className="text-sm text-muted-foreground">{plansDisplay[p.id as keyof typeof plansDisplay]?.price}</div>
                        </div>
                        <Button onClick={() => ccSubscribe(p.id)}>Subscribe with Card</Button>
                        <div className="rounded-md border p-2 text-xs">
                            <div className="mb-1 font-medium">Cash App to $Toreyx2024</div>
                            <div className="mb-2">After sending, paste your Cash App transaction ID below and submit.</div>
                            <Input ref={txRef} placeholder="Cash App transaction ID" className="mb-2" />
                            <Button variant="secondary" onClick={() => cashSubmit(p.id)}>Submit Cash App Reference</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

