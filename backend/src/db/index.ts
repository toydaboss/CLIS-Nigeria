import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

console.log({ db: process.env.DATABASE_URL });
export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://clis_nigeria:191413@localhost:5432/postgres",
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});
