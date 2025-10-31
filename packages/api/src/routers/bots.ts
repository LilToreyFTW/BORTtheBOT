import { publicProcedure, router } from "../index";
import { z } from "zod";
import { db } from "@project/db";
import { bot as botTable } from "@project/db/src/schema/bots";
import { eq } from "drizzle-orm";

const printerSchema = z.object({
    // Enclosure size (creator box) in cm: width x height x depth
    enclosureCm: z.object({ w: z.number().positive(), h: z.number().positive(), d: z.number().positive() }),
    // Steel base plate in mm (900x900x900 cube described) and working top surface size
    basePlateMm: z.object({ w: z.number().positive(), d: z.number().positive(), h: z.number().positive() }),
    // Downward laser array: count and footprint at focus
    downwardLasers: z.object({ count: z.literal(8), footprintCm: z.object({ w: z.number().positive(), d: z.number().positive(), h: z.number().positive() }) }),
    // Spherical lattice of micro-lasers in the roof
    roofSphere: z.object({ grid: z.tuple([z.literal(9), z.literal(9), z.literal(9)]), singleEmitterSizeCm: z.object({ w: z.number().positive(), h: z.number().positive(), d: z.number().positive() }) }),
});

const specsSchema = z.object({
    type: z.string().default("generic"),
    version: z.string().default("1.0"),
    printer: printerSchema,
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
    updateSpecs: publicProcedure
        .input(
            z.object({
                id: z.string().min(1),
                specs: specsSchema,
            }),
        )
        .mutation(async ({ input }) => {
            const now = new Date();
            await db
                .update(botTable)
                .set({ specsJson: JSON.stringify(input.specs), updatedAt: now })
                .where(eq(botTable.id, input.id));
            return { ok: true };
        }),
    calibratePrinter: publicProcedure
        .input(z.object({ id: z.string().min(1) }))
        .mutation(async ({ input }) => {
            const rows = await db.select().from(botTable).where(eq(botTable.id, input.id));
            if (!rows.length) {
                return { ok: false, error: "Bot not found" } as const;
            }
            const specs = specsSchema.parse(JSON.parse(rows[0].specsJson));
            // Basic bounds checks to keep footprints within base plate
            const plateWcm = specs.printer.basePlateMm.w / 10;
            const plateDcm = specs.printer.basePlateMm.d / 10;

            const fpW = specs.printer.downwardLasers.footprintCm.w;
            const fpD = specs.printer.downwardLasers.footprintCm.d;
            const marginW = (plateWcm - fpW) / 2;
            const marginD = (plateDcm - fpD) / 2;
            const safe = marginW >= 0 && marginD >= 0;

            // Simulated calibration matrix for 8 downward lasers positioned evenly across width
            const laserPositions = Array.from({ length: specs.printer.downwardLasers.count }, (_, i) => {
                const x = (plateWcm / (specs.printer.downwardLasers.count - 1)) * i;
                const y = 0; // roof mounting line
                const z = specs.printer.enclosureCm.h; // from roof down to base
                return { index: i, xCm: x, yCm: y, zCm: z };
            });

            return {
                ok: true as const,
                safe,
                plateWcm,
                plateDcm,
                marginsCm: { w: Math.max(0, marginW), d: Math.max(0, marginD) },
                downwardArray: laserPositions,
            };
        }),
    remove: publicProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
        await db.delete(botTable).where(eq(botTable.id, input.id));
        return { ok: true };
    }),
});


