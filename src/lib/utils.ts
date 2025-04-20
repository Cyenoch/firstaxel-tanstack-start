import { type ClassValue, clsx } from "clsx";
import { customAlphabet } from "nanoid";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function recordToArrayOfObjects(record: Record<string, string>) {
	return Object.entries(record).map(([key, value]) => ({ [key]: value }));
}

const alphabet =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const nanoid = customAlphabet(alphabet, 30);

export const getBaseUrl = () => {
	if (typeof window !== "undefined") return "";
	if (process.env.VITE_VERCEL_URL)
		return `https://${process.env.VITE_VERCEL_URL}`;
	return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const getDeployer = () => {
	if (typeof window !== "undefined") return "";
	if (process.env.VITE_VERCEL_URL) return `${process.env.VITE_VERCEL_URL}`;
	return "localhost";
};
