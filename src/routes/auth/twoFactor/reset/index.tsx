import ResetTwoFactor from "@/components/auth/reset-twofactor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/twoFactor/reset/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<ResetTwoFactor />
		</div>
	);
}
