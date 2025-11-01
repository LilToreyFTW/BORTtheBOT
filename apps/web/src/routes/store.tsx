import { createFileRoute, useSearch } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { CheckCircle, XCircle, CreditCard, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/store")({
    component: StorePage,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            status: (search.status as "success" | "cancel") || undefined,
        };
    },
});

const plansDisplay = {
    basic: { label: "Basic", price: "$9.99", features: ["Up to 3 robots", "Basic support", "Standard features"] },
    pro: { label: "Pro", price: "$40.99", features: ["Up to 10 robots", "Priority support", "Advanced features", "Export capabilities"] },
    yearly: { label: "Yearly", price: "$99.99", features: ["Unlimited robots", "24/7 support", "All features", "Early access"] },
    lifetime: { label: "Lifetime", price: "$400.99", features: ["Unlimited robots", "Lifetime support", "All features", "Lifetime updates"] },
} as const;

function StorePage() {
    const search = useSearch({ from: "/store" });
    const plans = useQuery(trpc.billing.listPlans.queryOptions());
    const createCheckout = useMutation(trpc.billing.createCheckout.mutationOptions());
    const recordCash = useMutation(trpc.billing.recordCashApp.mutationOptions());
    const [cashTxRefs, setCashTxRefs] = useState<Record<string, string>>({});

    // # ADDED: Show payment status from URL params
    const showPaymentStatus = search.status === "success" || search.status === "cancel";

    const ccSubscribe = async (planId: string) => {
        try {
        const res = await createCheckout.mutateAsync({
            planId,
            successUrl: window.location.origin + "/store?status=success",
            cancelUrl: window.location.origin + "/store?status=cancel",
        });
            if (res.url) {
                window.location.href = res.url;
            } else {
                toast.error("Failed to create checkout session");
            }
        } catch (error) {
            toast.error("Failed to process payment");
        }
    };

    const cashSubmit = async (planId: string) => {
        const ref = cashTxRefs[planId]?.trim();
        if (!ref) {
            toast.error("Please enter a transaction ID");
            return;
        }
        try {
        await recordCash.mutateAsync({ planId, txRef: ref });
            toast.success("Cash App payment reference submitted for review!");
            setCashTxRefs({ ...cashTxRefs, [planId]: "" });
        } catch (error) {
            toast.error("Failed to submit payment reference");
        }
    };

    return (
        <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Store</h1>
                <p className="text-muted-foreground">Choose a subscription plan for BORTtheBOT</p>
            </div>

            {/* # ADDED: Payment Status Banner */}
            {showPaymentStatus && (
                <Card className={`p-4 ${search.status === "success" ? "bg-green-500/10 border-green-500" : "bg-red-500/10 border-red-500"}`}>
                    <div className="flex items-center gap-3">
                        {search.status === "success" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                            <p className="font-medium">
                                {search.status === "success" ? "Payment Successful!" : "Payment Cancelled"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {search.status === "success" 
                                    ? "Your subscription has been activated." 
                                    : "Your payment was cancelled. You can try again anytime."}
                            </p>
                        </div>
                        </div>
                    </Card>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {plans.data?.map((p) => {
                    const planInfo = plansDisplay[p.id as keyof typeof plansDisplay];
                    const isPopular = p.id === "pro";
                    
                    return (
                        <Card 
                            key={p.id} 
                            className={`flex flex-col gap-4 p-6 relative ${isPopular ? "border-primary border-2" : ""}`}
                        >
                            {isPopular && (
                                <Badge className="absolute top-4 right-4">Popular</Badge>
                            )}
                            <div>
                                <div className="text-2xl font-bold mb-1">
                                    {planInfo?.label || p.name}
                                </div>
                                <div className="text-3xl font-bold mb-2">
                                    {planInfo?.price || "$0"}
                                </div>
                                <div className="text-sm text-muted-foreground">per month</div>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-2 flex-1">
                                {planInfo?.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="space-y-3">
                                <Button 
                                    className="w-full" 
                                    onClick={() => ccSubscribe(p.id)}
                                    disabled={createCheckout.isPending}
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    {createCheckout.isPending ? "Processing..." : "Subscribe with Card"}
                                </Button>
                                
                                <div className="rounded-md border p-3 text-xs bg-muted/50">
                                    <div className="flex items-center gap-2 mb-2 font-medium">
                                        <DollarSign className="h-4 w-4" />
                                        Cash App Payment
                                    </div>
                                    <p className="mb-2 text-muted-foreground">
                                        Send payment to <strong>$Toreyx2024</strong>, then enter your transaction ID below.
                                    </p>
                                    <Input 
                                        placeholder="Transaction ID" 
                                        value={cashTxRefs[p.id] || ""}
                                        onChange={(e) => setCashTxRefs({ ...cashTxRefs, [p.id]: e.target.value })}
                                        className="mb-2 text-xs"
                                    />
                                    <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        className="w-full"
                                        onClick={() => cashSubmit(p.id)}
                                        disabled={recordCash.isPending}
                                    >
                                        {recordCash.isPending ? "Submitting..." : "Submit Payment"}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
            
            {/* # ADDED: Payment Info Section */}
            <Card className="p-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-2">
                        <h3 className="font-semibold">Payment Information</h3>
                        <p className="text-sm text-muted-foreground">
                            All payments are processed securely. Credit card payments are handled by Stripe. 
                            Cash App payments require manual verification and may take 1-2 business days to process.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Subscriptions auto-renew unless cancelled. You can cancel anytime from your account settings.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

