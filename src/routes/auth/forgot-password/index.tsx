import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/forgot-password/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<ForgotPasswordForm />
		</div>
	);
}
