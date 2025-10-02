import { Pool, PoolClient, QueryResultRow } from "pg";
import "dotenv/config";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  // 本番で必要なら ssl: { rejectUnauthorized: false }
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> => {
  const result = await pool.query<T>(text, params);
  return result.rows; // ← これで routes 側の書き方と一致
};

export async function withTx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await fn(client);
    await client.query("COMMIT");
    return res;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
