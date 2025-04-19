import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import ConvexProvider from "../integrations/convex/provider";

import TanstackQueryLayout from "../integrations/tanstack-query/layout";

import appCss from "../styles.css?url";

import { getThemeSeverFn } from "@/actions/theme";
import { ThemeProvider, useTheme } from "@/providers/theme-provider";
import type { QueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { TRPCRouter } from "../integrations/trpc/router";

interface MyRouterContext {
	queryClient: QueryClient;
	trpc: TRPCOptionsProxy<TRPCRouter>;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "TanStack Start Starter",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	loader: async () => await getThemeSeverFn(),

	component: () => {
		const data = Route.useLoaderData();
		return (
			<ThemeProvider theme={data}>
				<RootDocument>
					<ConvexProvider>
						<Outlet />
						<TanStackRouterDevtools />
						<TanstackQueryLayout />
					</ConvexProvider>
				</RootDocument>
			</ThemeProvider>
		);
	},
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const { theme } = useTheme();
	return (
		<html lang="en" className={theme} suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
				<Toaster richColors />
			</body>
		</html>
	);
}
