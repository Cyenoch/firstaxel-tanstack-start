import ResetPasswordForm from "@/components/auth/reset-password-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/reset-password/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<ResetPasswordForm />
		</div>
	);
}
