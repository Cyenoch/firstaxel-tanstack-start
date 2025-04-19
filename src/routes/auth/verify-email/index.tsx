import VerifyEmailForm from "@/components/auth/verify-email-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/verify-email/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<VerifyEmailForm />{" "}
		</div>
	);
}
