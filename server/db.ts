import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "../drizzle/schema";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/imobiliaria_crm",
});

export const db = drizzle(pool, { schema });
