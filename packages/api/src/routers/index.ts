import { protectedProcedure, publicProcedure, router } from "../index";
import { botRouter } from "./bot";
import { botsRouter } from "./bots";

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
});
export type AppRouter = typeof appRouter;
