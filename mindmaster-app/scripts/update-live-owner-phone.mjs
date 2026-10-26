import pg from "pg";
const { Client } = pg;

import fs from "fs";
import path from "path";

function getDatabaseConfig() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    try {
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, "utf8").split("\n");
        for (const line of lines) {
          if (line.startsWith("DATABASE_URL=")) {
            dbUrl = line.split("=")[1].trim();
            break;
          }
        }
      }
    } catch {}
  }
  return dbUrl;
}

async function updateLiveOwner() {
  const dbUrl = getDatabaseConfig();
  const client = dbUrl
    ? new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
    : new Client({
        host: process.env.DB_HOST || "db.xyycqnpqnrtumoemlels.supabase.co",
        port: 5432,
        database: "postgres",
        user: "postgres",
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
      });

  try {
    await client.connect();
    const res = await client.query(
      "UPDATE staff_accounts SET phone = $1 WHERE staff_id = $2 RETURNING staff_id, full_name, phone, role;",
      ["+918459344077", "MMA-000"]
    );
    console.log("SUCCESS: Updated Owner Phone in live Supabase DB:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Update failed:", err.message);
    process.exit(1);
  }
}

updateLiveOwner();
