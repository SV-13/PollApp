import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function testDB() {
  const result = await pool.query("select now()");
  console.log("DB connected at:", result.rows[0].now);
}
