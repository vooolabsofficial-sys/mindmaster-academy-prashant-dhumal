import pg from 'pg';
import fs from 'fs';

const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
let dbUrl = '';
for (const line of lines) {
  if (line.trim().startsWith('DATABASE_URL=')) {
    dbUrl = line.trim().slice('DATABASE_URL='.length);
    break;
  }
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
  console.log('Tables in public schema:');
  console.log(res.rows.map(r => r.table_name).join(', '));
  await client.end();
}

run().catch(console.error);
