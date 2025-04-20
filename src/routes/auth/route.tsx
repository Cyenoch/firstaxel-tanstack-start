import { createFileRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<section className="flex h-screen items-center justify-center bg-zinc-50 px-4 py-12 md:min-h-full dark:bg-transparent">
			<Outlet />
		</section>
	);
}
