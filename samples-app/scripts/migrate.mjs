import postgres from 'postgres';
import { readFile } from 'node:fs/promises';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL');
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
try { await sql.unsafe(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8')); console.log('Schema ready. No samples inserted.'); }
finally { await sql.end(); }
