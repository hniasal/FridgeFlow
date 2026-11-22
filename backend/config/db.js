import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool, types } = pg;

// Parse PostgreSQL TIMESTAMP WITHOUT TIME ZONE (OID 1114) as UTC ISO string
types.setTypeParser(1114, (str) => {
  if (!str) return null;
  return new Date(str.replace(" ", "T") + "Z").toISOString();
});

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
      },
);

pool.on("connect", (client) => {
  client.query("SET TIME ZONE 'UTC'").catch(() => {});
});

export default pool;
