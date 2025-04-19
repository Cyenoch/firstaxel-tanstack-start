import { getHeader } from "@tanstack/react-start/server";
import { RefillingTokenBucket } from "./rate-limit";

export const globalBucket = new RefillingTokenBucket<string>(100, 1);

export async function globalGETRateLimit(): Promise<boolean> {
	const ip = getHeader("X-Forwarded-For");
	if (ip === null) {
		return true;
	}
	return globalBucket.consume(ip as string, 1);
}

export async function globalPOSTRateLimit(): Promise<boolean> {
	const ip = getHeader("X-Forwarded-For");
	if (ip === null) {
		return true;
	}
	return globalBucket.consume(ip as string, 3);
}
