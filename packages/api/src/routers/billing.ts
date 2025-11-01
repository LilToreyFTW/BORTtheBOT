import { publicProcedure, router } from "../index";
import { z } from "zod";
import Stripe from "stripe";
import { db } from "@project/db";
import { payment, plan, subscription } from "@project/db/schema/billing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });

export const billingRouter = router({
    listPlans: publicProcedure.query(async () => {
        // Seed in-memory plans if DB empty
        const rows = await db.select().from(plan);
        if (!rows.length) {
            const now = new Date();
            const defaults = [
                { id: "basic", name: "Basic", priceCents: 999, interval: "basic" },
                { id: "pro", name: "Pro", priceCents: 4099, interval: "pro" },
                { id: "yearly", name: "Yearly", priceCents: 9999, interval: "yearly" },
                { id: "lifetime", name: "Lifetime", priceCents: 40099, interval: "lifetime" },
            ];
            await db.insert(plan).values(defaults.map((p) => ({ ...p, createdAt: now })));
            return defaults;
        }
        return rows;
    }),
    createCheckout: publicProcedure
        .input(
            z.object({
                priceId: z.string().optional(),
                planId: z.string(),
                successUrl: z.string().url(),
                cancelUrl: z.string().url(),
            }),
        )
        .mutation(async ({ input }) => {
            if (!process.env.STRIPE_SECRET_KEY) {
                throw new Error("Stripe not configured");
            }
            const plans = await db.select().from(plan);
            const p = plans.find((x) => x.id === input.planId);
            if (!p) throw new Error("Plan not found");

            const session = await stripe.checkout.sessions.create({
                mode: p.interval === "lifetime" ? "payment" : "subscription",
                line_items: input.priceId
                    ? [{ price: input.priceId, quantity: 1 }]
                    : [{ price_data: { currency: "usd", product_data: { name: p.name }, unit_amount: p.priceCents, recurring: p.interval === "lifetime" ? undefined : { interval: p.interval === "yearly" ? "year" : "month" } }, quantity: 1 }],
                success_url: input.successUrl,
                cancel_url: input.cancelUrl,
            });

            return { id: session.id, url: session.url };
        }),
    recordCashApp: publicProcedure
        .input(z.object({ planId: z.string(), txRef: z.string().min(3) }))
        .mutation(async ({ input }) => {
            const plans = await db.select().from(plan);
            const p = plans.find((x) => x.id === input.planId);
            if (!p) throw new Error("Plan not found");
            const now = new Date();
            await db.insert(payment).values({
                id: crypto.randomUUID(),
                userId: "anon",
                planId: p.id,
                method: "cashapp",
                amountCents: p.priceCents,
                currency: "USD",
                reference: input.txRef,
                status: "pending",
                createdAt: now,
            });
            return { ok: true };
        }),
});


