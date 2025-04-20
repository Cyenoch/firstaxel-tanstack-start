import RegisterSecurityKeyForm from "@/components/auth/register-security-key-form";
import { getCurrentSession } from "@/lib/auth/server/session";
import { hashUserId } from "@/lib/auth/server/utils";
import { getUserSecurityKeyCredentials } from "@/lib/auth/server/webauthn";
import { bigEndian } from "@oslojs/binary";
import { encodeBase64 } from "@oslojs/encoding";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getUserSecurityKeyDetails = createServerFn({}).handler(async () => {
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

	const credentials = await getUserSecurityKeyCredentials(user.id);

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

export const Route = createFileRoute("/auth/twoFactor/security-key/register/")({
	component: RouteComponent,
	loader: async () => await getUserSecurityKeyDetails(),
});

function RouteComponent() {
	const { credentialUserId, credentials, user } = Route.useLoaderData();
	return (
		<div>
			<RegisterSecurityKeyForm
				encodedCredentialIds={credentials}
				user={user}
				encodedCredentialUserId={credentialUserId}
			/>
		</div>
	);
}
