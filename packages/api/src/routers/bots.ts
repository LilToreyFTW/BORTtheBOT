import { publicProcedure, router } from "../index";
import { z } from "zod";
import { db } from "@project/db";
import { bot as botTable } from "@project/db/schema/bots";
import { eq } from "drizzle-orm";
// # ADDED: Node FS for preset program scaffolding
import fs from "node:fs";
import path from "node:path";

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
        // # ADDED: Create local bot folder and preset Python starter file
        try {
            const baseDir = process.env.BOT_STORAGE_DIR ?? path.resolve(process.cwd(), "bot_storage");
            const botDir = path.join(baseDir, input.id);
            fs.mkdirSync(botDir, { recursive: true });
            const preset = [
                "#!/usr/bin/env python3",
                "# BORTtheBOT Robot Builder - Starter Program",
                "# This preset is generated automatically for your new robot.",
                "# Fill in your logic inside the placeholders below.",
                "",
                "class Robot:",
                "    def __init__(self):",
                "        # Initialize your robot state here",
                "        pass",
                "",
                "    def setup(self):",
                "        # Run once at startup",
                "        pass",
                "",
                "    def loop(self):",
                "        # Main loop - called repeatedly",
                "        pass",
                "",
                "def main():",
                "    robot = Robot()",
                "    robot.setup()",
                "    # Replace this simple loop with your control logic",
                "    # while True: robot.loop()",
                "    pass",
                "",
                "if __name__ == '__main__':",
                "    main()",
                "",
            ].join("\n");
            const presetPath = path.join(botDir, "main.py");
            if (!fs.existsSync(presetPath)) {
                fs.writeFileSync(presetPath, preset, "utf8");
            }
            // Also drop a simple README for users
            const readme = [
                `# Robot: ${input.name}`,
                "",
                "Files:",
                "- main.py  # Your starter Python file",
                "",
                "Set environment BOT_STORAGE_DIR to change this storage location.",
                "",
            ].join("\n");
            const readmePath = path.join(botDir, "README.md");
            if (!fs.existsSync(readmePath)) {
                fs.writeFileSync(readmePath, readme, "utf8");
            }
        } catch (_) {
            // ignore filesystem errors to avoid failing API
        }
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

            // # UPDATED: Simulated calibration matrix for 8 downward lasers with arm rotation data
            const laserPositions = Array.from({ length: specs.printer.downwardLasers.count }, (_, i) => {
                const x = (plateWcm / (specs.printer.downwardLasers.count - 1)) * i - plateWcm / 2;
                const y = specs.printer.enclosureCm.h; // roof mounting line
                const z = 0;
                return { index: i, xCm: x, yCm: y, zCm: z };
            });

            // # ADDED: Calculate arm rotation angles for 360° calibration scan of 900x900x900 plate
            const plateSizeCm = 90; // 900mm = 90cm
            const armRotations = Array.from({ length: specs.printer.downwardLasers.count }, (_, i) => {
                // Each arm rotates 360° with offset
                const baseYaw = (i * Math.PI / 4); // Staggered starting positions
                return {
                    index: i,
                    shoulderYaw: baseYaw, // 360° rotation capability
                    shoulderPitch: Math.PI / 4, // 45° down to plate
                    elbow: 0, // Fine adjustment angle
                    wristYaw: 0, // Wrist yaw rotation
                    wristPitch: 0, // Wrist pitch for beam direction
                };
            });

            return {
                ok: true as const,
                safe,
                plateWcm,
                plateDcm,
                marginsCm: { w: Math.max(0, marginW), d: Math.max(0, marginD) },
                downwardArray: laserPositions,
                armRotations, // # ADDED: Arm rotation data for calibration
            };
        }),
    remove: publicProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
        await db.delete(botTable).where(eq(botTable.id, input.id));
        return { ok: true };
    }),
});


