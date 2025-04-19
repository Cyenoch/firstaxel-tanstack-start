import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./drizzle";


const driver = postgres(process.env.DATABASE_URL as string);
export const database = drizzle({
	client: driver,
	schema,
	casing: "snake_case",
});
