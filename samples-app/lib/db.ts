import 'server-only';
import postgres from 'postgres';
let connection: ReturnType<typeof postgres> | undefined;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return connection ??= postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
}
