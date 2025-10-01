import { Pool, QueryResultRow } from "pg";
import "dotenv/config";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // 本番で必要なら ssl: { rejectUnauthorized: false }
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const res = await pool.query<T>(text, params);
  return res.rows as T[];
}
