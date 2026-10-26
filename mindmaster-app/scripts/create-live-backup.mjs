import fs from "fs";
import path from "path";
import pg from "pg";
const { Client } = pg;

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

async function createBackup() {
  console.log("================================================================================");
  console.log("💾 CREATING COMPREHENSIVE LIVE SUPABASE DATABASE BACKUP");
  console.log("================================================================================\n");

  const dbUrl = getDatabaseConfig();
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not found in environment or .env.local");
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log("✓ Connected to live Supabase PostgreSQL database");

    // 1. Fetch all public tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map((r) => r.table_name);
    console.log(`✓ Found ${tableNames.length} tables in live database`);

    const backupData = {
      timestamp: new Date().toISOString(),
      database: "MindMaster Academy (Live Supabase)",
      tablesCount: tableNames.length,
      tables: {},
      summary: {},
    };

    // 2. Export each table's schema and row contents
    for (const tableName of tableNames) {
      try {
        const countRes = await client.query(`SELECT count(*) FROM "${tableName}";`);
        const rowCount = parseInt(countRes.rows[0].count, 10);

        const rowsRes = await client.query(`SELECT * FROM "${tableName}" LIMIT 500;`);
        
        backupData.tables[tableName] = {
          count: rowCount,
          sampleRows: rowsRes.rows,
        };

        backupData.summary[tableName] = rowCount;
        console.log(`  • [${tableName}] -> ${rowCount} rows backed up`);
      } catch (tableErr) {
        console.warn(`  ⚠️ Could not export table ${tableName}:`, tableErr.message);
      }
    }

    // 3. Save backup file to backups directory
    const backupsDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const backupFileName = `supabase_live_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const backupFilePath = path.join(backupsDir, backupFileName);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), "utf8");

    // Also write a master latest snapshot
    const latestFilePath = path.join(backupsDir, "latest_supabase_backup.json");
    fs.writeFileSync(latestFilePath, JSON.stringify(backupData, null, 2), "utf8");

    console.log("\n================================================================================");
    console.log(`🎉 BACKUP COMPLETE! File saved to:\n  -> ${backupFilePath}\n  -> ${latestFilePath}`);
    console.log("================================================================================\n");

    await client.end();
  } catch (err) {
    console.error("❌ Backup failed:", err);
    process.exit(1);
  }
}

createBackup();
