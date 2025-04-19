import TwoFactor from "@/components/auth/twofactor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/twoFactor/setup/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<TwoFactor />
		</div>
	);
}
