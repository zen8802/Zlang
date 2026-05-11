import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  const r = await sql`
    SELECT conname, contype, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
  `
  console.log(JSON.stringify(r, null, 2))
}

main().catch(console.error)
