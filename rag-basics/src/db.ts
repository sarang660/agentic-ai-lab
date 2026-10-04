import "dotenv/config";
import { Pool } from "pg";

// --------------------------------------------------
// Connection pool — reuses connections instead of
// opening a new one for every query
// --------------------------------------------------

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --------------------------------------------------
// Small helper so callers don't need to import `pg`
// types everywhere
// --------------------------------------------------

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows;
}
