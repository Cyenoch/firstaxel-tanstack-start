import { createMiddleware } from "@tanstack/react-start";

export const authMiddleware = createMiddleware({}).server(
	async ({ next, data }) => {
		console.log("Request received:", data);
		const result = await next();
		console.log("Response processed:", result);
		return result;
	},
);
