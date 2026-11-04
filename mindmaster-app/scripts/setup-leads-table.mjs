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
  console.log('Connected to PostgreSQL Supabase Cloud.');

  await client.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      email VARCHAR(200),
      course_interest VARCHAR(200) DEFAULT 'General Inquiry',
      message TEXT,
      source VARCHAR(100) DEFAULT 'Website Form',
      status VARCHAR(50) DEFAULT 'new',
      created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
    );

    CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
  `);

  console.log('✅ Table "leads" created / verified successfully in Supabase Cloud!');

  // Check table count
  const res = await client.query('SELECT count(*) FROM leads;');
  console.log('Current leads count in Supabase:', res.rows[0].count);

  await client.end();
}

run().catch(console.error);
