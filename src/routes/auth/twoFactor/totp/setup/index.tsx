import { encodeBase64 } from "@oslojs/encoding";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import TOTPSetupForm from "@/components/auth/totp-setup-form";
import { env } from "@/env";
import { getCurrentSession } from "@/lib/auth/server/session";
import { createTOTPKeyURI } from "@oslojs/otp";
import { renderSVG } from "uqr";

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

	const totpKey = new Uint8Array(20);
	crypto.getRandomValues(totpKey);
	const encodedTOTPKey = encodeBase64(totpKey);
	const keyURI = createTOTPKeyURI(
		env.VITE_APP_NAME ? env.VITE_APP_NAME : "Auth Starter",
		user.firstname,
		totpKey,
		30,
		6,
	);

	const qrcode = renderSVG(keyURI);

	return {
		encodedTOTPKey,
		qrcode,
	};
});

export const Route = createFileRoute("/auth/twoFactor/totp/setup/")({
	component: RouteComponent,
	loader: async () => await totpSetup(),
});

function RouteComponent() {
	const { encodedTOTPKey, qrcode } = Route.useLoaderData();
	return (
		<div>
			<TOTPSetupForm qrCode={qrcode} encodeTOTPKey={encodedTOTPKey} />
		</div>
	);
}
