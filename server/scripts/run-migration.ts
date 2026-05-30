import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sql = readFileSync(resolve(__dirname, '../../supabase/migrations/001_initial_schema.sql'), 'utf-8');

async function runMigration() {
  console.log('Running migration via Supabase SQL API...');
  console.log(`Project: ${SUPABASE_URL}`);
  
  // Use the pg_graphql/sql endpoint  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({}),
  });

  // The REST API doesn't support raw SQL. Let's try the /pg endpoint
  const pgResponse = await fetch(`${SUPABASE_URL}/pg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (pgResponse.ok) {
    console.log('Migration executed successfully!');
  } else {
    const text = await pgResponse.text();
    console.log(`Status: ${pgResponse.status}`);
    console.log(`Response: ${text.substring(0, 500)}`);
    console.log('\n---');
    console.log('The Supabase REST API does not support raw SQL.');
    console.log('Please run the migration manually:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy the contents of supabase/migrations/001_initial_schema.sql');
    console.log('3. Paste and run it');
  }
}

runMigration().catch(console.error);
