import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./drizzle";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export const database = drizzle({
	client: pool,
	schema,
	casing: "snake_case",
});
