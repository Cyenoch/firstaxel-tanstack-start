import { authRouter } from "./routes/auth";
import { createTRPCRouter } from "./server";

export const trpcRouter = createTRPCRouter({
    auth: authRouter
});
export type TRPCRouter = typeof trpcRouter;
