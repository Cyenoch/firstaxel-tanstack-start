import VerifyUserPasskeyForm from "@/components/auth/verify-passkey-form";
import { getCurrentSession } from "@/lib/auth/server/session";
import { getUserPasskeyCredentials } from "@/lib/auth/server/webauthn";
import { encodeBase64 } from "@oslojs/encoding";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getUserPasskeyDetails = createServerFn({}).handler(async () => {
	const { session, user } = await getCurrentSession();
	if (session === null || user === null) {
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
	const credentials = await getUserPasskeyCredentials(user.id);

	const stringifiedArrayofUserCredentials = credentials.map((credential) =>
		encodeBase64(credential.id),
	);

	return {
		credentials: stringifiedArrayofUserCredentials,
	};
});

export const Route = createFileRoute("/auth/twoFactor/passkey/")({
	component: RouteComponent,
	loader: async () => await getUserPasskeyDetails(),
});

function RouteComponent() {
	const { credentials } = Route.useLoaderData();
	return (
		<div>
			<VerifyUserPasskeyForm encodedCredentialIds={credentials} />
		</div>
	);
}
