import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import TOTPVerifyForm from "@/components/auth/totp-verify-form";
import { getCurrentSession } from "@/lib/auth/server/session";

const totpSetup = createServerFn({}).handler(async () => {
	const { session, user } = await getCurrentSession();
	if (session === null) {
		throw redirect({
			to: "/auth/login",
		});
	}
	if (!user.emailVerified) {
		throw redirect({
			to: "/auth/verify-email",
		});
	}

	if (!user.registered2FA) {
		throw redirect({
			to: "/auth/twoFactor/setup",
		});
	}
	if (session.twoFactorVerified) {
		throw redirect({
			to: "/",
		});
	}
});

export const Route = createFileRoute("/auth/twoFactor/totp/")({
	component: RouteComponent,
	loader: async () => await totpSetup(),
});

function RouteComponent() {
	return (
		<div>
			<TOTPVerifyForm />
		</div>
	);
}
