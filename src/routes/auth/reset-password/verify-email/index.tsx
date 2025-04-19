import VerifyPasswordEmail from "@/components/auth/verify-password-reset";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/reset-password/verify-email/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<VerifyPasswordEmail />
		</div>
	);
}
