import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { t } from "./server";

import * as schema from "../../database/drizzle";

const extendTRPCMiddleware = t.middleware(async ({ next, ctx }) => {
	const driver = postgres(import.meta.env.DATABASE_URL as string);
	const database = drizzle({
		client: driver,
		schema,
		casing: "snake_case",
	});


	return await next({
		ctx: {
			...ctx,
			database,
		},
	});
});

export const privateProcedure = t.procedure.use(extendTRPCMiddleware);
