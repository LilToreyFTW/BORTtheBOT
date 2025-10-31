import { protectedProcedure, publicProcedure, router } from "../index";
import { botRouter } from "./bot";
import { botsRouter } from "./bots";
import { billingRouter } from "./billing";
// # ADDED
import { programsRouter } from "./programs";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
    bot: botRouter,
    bots: botsRouter,
    billing: billingRouter,
    // # ADDED: programs endpoints
    programs: programsRouter,
});
export type AppRouter = typeof appRouter;
