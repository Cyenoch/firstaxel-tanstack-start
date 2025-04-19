import {
	deleteSessionTokenCookie,
	getCurrentSession,
	invalidateSession,
} from "@/lib/auth/server/session";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { createError, setResponseStatus } from "@tanstack/react-start/server";
import { KeySquare, Loader2, Lock, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";

const logOutAction = createServerFn().handler(async () => {
	const { session } = await getCurrentSession();

	if (session === null) {
		throw createError({
			status: 401,
			message: "Not authenticated",
		});
	}

	invalidateSession(session.id);
	deleteSessionTokenCookie();
	setResponseStatus(200);

	return {
		redirectUrl: "/auth/login",
		message: "Logout successful",
	};
});

const TwoFactor = () => {
	const navigate = useNavigate();
	const logOut = useServerFn(logOutAction);
	const { mutate: logOutMutation, isPending } = useMutation({
		mutationKey: ["logout"],
		mutationFn: logOut,
		onSuccess: (data) => {
			toast.success(data?.message);
			navigate({
				to: "/auth/login",
			});
		},
	});

	return (
		<div>
			<Card className="w-lg">
				<CardHeader>
					<CardTitle className="text-3xl font-bold">
						Two-factor authentication
					</CardTitle>
					<CardDescription>
						Add a second layer of security to your account by enabling
						two-factor authentication.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ul className="flex flex-col gap-4">
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
					</ul>
				</CardContent>

				<CardFooter className="w-full flex items-center justify-center gap-3">
					<div className="p-3 w-full">
						<p className="text-center text-accent-foreground text-sm">
							Not ready yet ?
							<Button
								asChild
								variant="link"
								className="px-2 w-full"
								onClick={() => logOutMutation({})}
							>
								{isPending ? (
									<Loader2 className="animate-spin size-6" />
								) : (
									<Link to="/auth/login">Logout</Link>
								)}
							</Button>
						</p>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
};

export default TwoFactor;
