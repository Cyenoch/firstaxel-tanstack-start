import { trpcRouter } from "@/integrations/trpc/router";
import ip from "@arcjet/ip";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import {
	deleteCookie,
	getCookie,
	parseCookies,
	setCookie,
} from "@tanstack/react-start/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { CookieSerializeOptions } from "cookie-es";

function handler({ request }: { request: Request }) {
	return fetchRequestHandler({
		req: request,
		router: trpcRouter,
		endpoint: "/api/trpc",
		createContext: async ({ req }) => {
			const globalIP = ip(req);

			const set = (
				name: string,
				value: string,
				serializeOptions?: CookieSerializeOptions,
			) => {
				setCookie(name, value, serializeOptions);
			};
			const get = (name: string) => {
				return getCookie(name);
			};

			const remove = (name: string) => {
				deleteCookie(name);
			};
			const getAll = () => {
				return parseCookies();
			};

			return {
				request: req,
				headers: req.headers,
				ip: globalIP,
				cookies: {
					get,
					set,
					getAll,
					delete: remove,
				},
			};
		},
	});
}

export const APIRoute = createAPIFileRoute("/api/trpc/$")({
	GET: handler,
	POST: handler,
});
