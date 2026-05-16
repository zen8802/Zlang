import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  // Test that .query() exists and accepts dynamic SQL + params
  const r = await sql.query('SELECT $1::text as v', ['hello'])
  console.log(JSON.stringify(r, null, 2))
}
main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
