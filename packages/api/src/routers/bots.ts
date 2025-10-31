import { publicProcedure, router } from "../index";
import { z } from "zod";
import { db } from "@project/db";
import { bot as botTable } from "@project/db/src/schema/bots";
import { eq } from "drizzle-orm";

const specsSchema = z.object({
    // free-form schema for now; extend later
    type: z.string().default("generic"),
    version: z.string().default("1.0"),
});

const botCreateSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    specs: specsSchema.default({ type: "generic", version: "1.0" }),
});

export const botsRouter = router({
    list: publicProcedure.query(async () => {
        const rows = await db.select().from(botTable);
        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description ?? undefined,
            specs: JSON.parse(r.specsJson),
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        }));
    }),
    create: publicProcedure.input(botCreateSchema).mutation(async ({ input }) => {
        const now = new Date();
        await db.insert(botTable).values({
            id: input.id,
            name: input.name,
            description: input.description ?? null,
            specsJson: JSON.stringify(input.specs),
            createdAt: now,
            updatedAt: now,
        });
        return { ok: true };
    }),
    remove: publicProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
        await db.delete(botTable).where(eq(botTable.id, input.id));
        return { ok: true };
    }),
});


