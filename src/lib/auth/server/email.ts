import { database } from "@/database";
import { users } from "@/database/drizzle";
import { eq } from "drizzle-orm";

const emailRegex = /^.+@.+\..+$/;

export function verifyEmailInput(email: string): boolean {
	return emailRegex.test(email) && email.length < 256;
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
	try {
		const [row] = await database
			.select()
			.from(users)
			.where(eq(users.email, email));

		if (!row) {
			return false;
		}

		throw new Error("User email already exist in the database");
	} catch (error) {
		return true;
	}
}
