import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const plan = sqliteTable("plan", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull(),
    interval: text("interval").notNull(), // basic, pro, yearly, lifetime
    stripePriceId: text("stripe_price_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const subscription = sqliteTable("subscription", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    planId: text("plan_id").notNull(),
    status: text("status").notNull(), // active, past_due, canceled, pending
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const payment = sqliteTable("payment", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    planId: text("plan_id").notNull(),
    method: text("method").notNull(), // stripe, cashapp
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull(), // USD
    reference: text("reference"), // stripe session/payment intent id or cash app tx
    status: text("status").notNull(), // pending, succeeded, failed
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});


