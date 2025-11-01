import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@project/api/context";
import { appRouter } from "@project/api/routers/index";
import { auth } from "@project/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
// # ADDED
import { db } from "@project/db";
import { botProgram } from "@project/db/schema/bots";
import { eq } from "drizzle-orm";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		// # UPDATED: Allow access from WireGuard network and localhost
		origin: process.env.CORS_ORIGIN 
			? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
			: [
				"http://10.2.0.2:3001",
				"http://10.2.0.2:3000",
				"http://localhost:3001",
				"http://localhost:3000",
				"http://127.0.0.1:3001",
				"http://127.0.0.1:3000",
				"*" // Allow all origins for WireGuard network devices
			],
		allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
		allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
		credentials: true,
		exposeHeaders: ["Content-Length", "Content-Disposition"],
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.get("/", (c) => {
	return c.text("OK");
});

// # ADDED: simple program download endpoint
app.get("/programs/:token", async (c) => {
    const token = c.req.param("token");
    if (!token) return c.text("Bad token", 400);
    const programId = token.split(".")[0];
    if (!programId) return c.text("Bad token", 400);
    const rows = await db.select().from(botProgram).where(eq(botProgram.id, programId));
    if (!rows.length || !rows[0]) return c.text("Not found", 404);
    const p = rows[0]!;
    const filename = `bot_${p.botId}.${p.language === "python" ? "py" : "txt"}`;
    c.header("Content-Type", "text/plain; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename=\"${filename}\"`);
    return c.body(p.code);
});

export default app;
