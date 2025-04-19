import RegisterUserPasskeyForm from "@/components/auth/register-passkey-form";
import { get2FARedirect } from "@/lib/auth/server/2fa";
import { getCurrentSession } from "@/lib/auth/server/session";
import { hashUserId } from "@/lib/auth/server/utils";
import { getUserPasskeyCredentials } from "@/lib/auth/server/webauthn";
import { bigEndian } from "@oslojs/binary";
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
	if (user.registered2FA && !session.twoFactorVerified) {
		throw redirect({
			to: get2FARedirect(user),
		});
	}
	const credentials = await getUserPasskeyCredentials(user.id);

	const credentialUserId = new Uint8Array(8);

	bigEndian.putUint64(credentialUserId, BigInt(hashUserId(user.id)), 0);
	const stringifiedArrayofUserCredentials = credentials.map((credential) =>
		encodeBase64(credential.id),
	);

	return {
		credentialUserId: encodeBase64(credentialUserId),
		credentials: stringifiedArrayofUserCredentials,
		user: {
			firstname: user.firstname,
			email: user.email,
		},
	};
});

export const Route = createFileRoute("/auth/twoFactor/passkey/register/")({
	component: RouteComponent,
	loader: async () => await getUserPasskeyDetails(),
});

function RouteComponent() {
	const { credentialUserId, credentials, user } = Route.useLoaderData();
	return (
		<div>
			<RegisterUserPasskeyForm
				encodedCredentialIds={credentials}
				user={user}
				encodedCredentialUserId={credentialUserId}
			/>
		</div>
	);
}
