import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getAllUser2FA } from "@/lib/auth/server/2fa";
import { getCurrentSession } from "@/lib/auth/server/session";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { KeySquare, Lock, Smartphone } from "lucide-react";

const user2FA = createServerFn({}).handler(async () => {
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

	const twoFactor = await getAllUser2FA(user.id);
	return {
		...twoFactor,
	};
});

export const Route = createFileRoute("/auth/twoFactor/")({
	component: RouteComponent,
	loader: async () => await user2FA(),
});

function RouteComponent() {
	const { registeredPasskey, registeredSecurityKey, registeredTOTP } =
		Route.useLoaderData();
	return (
		<div>
			<Card className="w-md">
				<CardHeader className="border-b border-muted-foreground">
					<CardTitle className="text-2xl">Two-factor Authentication</CardTitle>
					<CardDescription>
						Select the 2FA method you want to use to verify your identity.
					</CardDescription>{" "}
				</CardHeader>
				<CardContent>
					<ul className="flex flex-col gap-4">
						{registeredTOTP && (
							<li>
								<Button
									className="h-14 w-full border"
									variant={"outline"}
									asChild
								>
									<Link to="/auth/twoFactor/totp/setup">
										<Smartphone className="size-6 mr-2" />
										Authenticator
									</Link>
								</Button>
							</li>
						)}
						{registeredPasskey && (
							<li>
								<Button
									className="h-14 w-full border"
									variant={"outline"}
									asChild
								>
									<Link to="/auth/twoFactor/passkey/register">
										<Lock className="size-6 mr-2" />
										Passkeys
									</Link>
								</Button>
							</li>
						)}

						{registeredSecurityKey && (
							<li>
								<Button
									className="h-14 w-full border"
									variant={"outline"}
									asChild
								>
									<Link to="/auth/twoFactor/security-key/register">
										<KeySquare className="size-6 mr-2" />
										Security keys
									</Link>
								</Button>
							</li>
						)}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
