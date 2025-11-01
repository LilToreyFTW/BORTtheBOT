import { publicProcedure, router } from "../index";
import { z } from "zod";
import { db } from "@project/db";
import { botProgram } from "@project/db/schema/bots";
import { eq } from "drizzle-orm";

// # ADDED: Programs router for attaching code (e.g., Python) to bots
export const programsRouter = router({
	listByBot: publicProcedure.input(z.object({ botId: z.string().min(1) })).query(async ({ input }) => {
		const rows = await db.select().from(botProgram).where(eq(botProgram.botId, input.botId));
		return rows.map((r) => ({ id: r.id, botId: r.botId, language: r.language, code: r.code, createdAt: r.createdAt, updatedAt: r.updatedAt }));
	}),
	upsert: publicProcedure
		.input(
			z.object({
				id: z.string().min(1),
				botId: z.string().min(1),
				language: z.enum(["python"]).default("python"),
				code: z.string().min(1),
			}),
		)
		.mutation(async ({ input }) => {
			const now = new Date();
			// Try update; if not exists, insert
			const updated = await db
				.update(botProgram)
				.set({ code: input.code, language: input.language, updatedAt: now })
				.where(eq(botProgram.id, input.id));
			if ((updated as any).rowsAffected === 0) {
				await db.insert(botProgram).values({
					id: input.id,
					botId: input.botId,
					language: input.language,
					code: input.code,
					createdAt: now,
					updatedAt: now,
				});
			}
			return { ok: true } as const;
		}),
	remove: publicProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
		await db.delete(botProgram).where(eq(botProgram.id, input.id));
		return { ok: true };
	}),
	// Provide a simple signed token for download (Hono route will serve file)
	createDownloadToken: publicProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ input }) => {
			// naive token - in real life, sign JWT; here short-lived uid
			const token = `${input.id}.${Math.random().toString(36).slice(2)}`;
			// Return token; server will validate first segment as program id
			return { token };
		}),
});
