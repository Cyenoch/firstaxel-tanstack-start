import { initTRPC } from "@trpc/server";
import type { CookieSerializeOptions } from "cookie-es";
import superjson from "superjson";
import { ZodError } from "zod";

const createTRPCContext = async (opts: {
	headers: Headers;
	request: Request;
	ip: string;
	cookies: {
		get: (name: string) => string | undefined;
		set: (
			name: string,
			value: string,
			serializeOptions?: CookieSerializeOptions,
		) => void;
		getAll: () => Record<string, string>;
		delete: (name: string) => void;
	};
}) => {
	return {
		...opts,
	};
};
export const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
