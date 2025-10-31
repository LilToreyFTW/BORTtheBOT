import { protectedProcedure, publicProcedure, router } from "../index";
import { botRouter } from "./bot";
import { botsRouter } from "./bots";
import { billingRouter } from "./billing";

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
});
export type AppRouter = typeof appRouter;
