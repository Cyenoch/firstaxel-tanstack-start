import { getHeader } from "@tanstack/react-start/server";
import { RefillingTokenBucket } from "./rate-limit";
import { serverOnly } from "@tanstack/react-start";

export const globalBucket = new RefillingTokenBucket<string>(100, 1);

export const globalGETRateLimit = serverOnly(() => {
	const ip = getHeader("X-Forwarded-For");
	if (ip === null) {
		return true;
	}
	return globalBucket.consume(ip as string, 1);
})

export const globalPOSTRateLimit = serverOnly(() => {
	const ip = getHeader("X-Forwarded-For");
	if (ip === null) {
		return true;
	}
	return globalBucket.consume(ip as string, 3);
})
