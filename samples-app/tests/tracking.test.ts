import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
const mocks = vi.hoisted(() => ({ db: vi.fn(), send: vi.fn(), viewer: vi.fn(), after: vi.fn() }));
vi.mock('../lib/db', () => ({ db: mocks.db }));
vi.mock('resend', () => ({ Resend: class { emails = { send: mocks.send }; } }));
vi.mock('../lib/auth', () => ({ viewer: mocks.viewer }));
vi.mock('next/server', () => ({ after: mocks.after }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: 'broker-one' }) }) }));
import { recordView } from '../lib/tracking';
import { flushNotifications } from '../lib/notifications';
import { POST } from '../app/api/views/route';
let database: PGlite;
function adapter(client: { query: (sql: string, values?: any[]) => Promise<any> }): any {
  const tag: any = async (parts: TemplateStringsArray, ...values: any[]) => {
    const sql = parts.reduce((result, part, i) => result + (i ? '$' + i : '') + part, '');
    return (await client.query(sql, values)).rows;
 };
 tag.json = (value: unknown) => JSON.stringify(value);
 tag.begin = (fn: (sql: any) => unknown) => database.transaction(tx => fn(adapter(tx)) as any);
 return tag;
}
beforeAll(async () => {
 database = new PGlite();
 await database.exec(await readFile('db/schema.sql', 'utf8'));
 mocks.db.mockReturnValue(adapter(database));
});
afterAll(async () => { await database.close(); });
beforeEach(async () => {
 await database.exec('TRUNCATE notification_outbox, sample_views, samples RESTART IDENTITY CASCADE');
 await database.query("INSERT INTO samples VALUES ('rtl', 'RTL', 'Summary', 'Design', 'Private body', true), ('tb', 'Testbench', 'Summary', 'Verification', 'Private body', true), ('draft', 'Draft', 'Summary', 'Design', 'Private body', false)");
 process.env.APP_URL = 'https://samples.arcverex.io';
 process.env.RESEND_API_KEY = 'test-only';
 mocks.send.mockReset().mockResolvedValue({ data: { id: 'fake' }, error: null });
 mocks.viewer.mockReset().mockResolvedValue({ id: 'user-one', email: 'alice@example.com' });
 mocks.after.mockReset();
});
const user = { id: 'user-one', email: 'alice@example.com' };
describe('tracking and notification persistence', () => {
 it('coalesces refreshes while retaining distinct sample views and one daily notification', async () => {
  await recordView(user, 'rtl', 'broker-one');
  await recordView(user, 'rtl', 'broker-one');
  await recordView(user, 'tb', 'broker-one');
  expect((await database.query('SELECT * FROM sample_views')).rows).toHaveLength(2);
  const rows: any = (await database.query('SELECT * FROM notification_outbox')).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0].payload.to).toEqual(['ashish@arcverex.io']);
  expect(rows[0].payload.text).toContain('alice@example.com');
  expect(rows[0].payload.text).toContain('broker-one');
 });
 it('does not record missing or unpublished samples', async () => {
  expect(await recordView(user, 'draft', null)).toBe(false);
  expect(await recordView(user, 'missing', null)).toBe(false);
  expect((await database.query('SELECT * FROM notification_outbox')).rows).toHaveLength(0);
 });
 it('sends once and preserves the payload and key across a failed attempt', async () => {
  await recordView(user, 'rtl', null);
  mocks.send.mockResolvedValueOnce({ error: { message: 'temporary' } });
  expect((await flushNotifications()).sent).toBe(0);
  const firstCall = mocks.send.mock.calls[0];
  await database.exec("UPDATE notification_outbox SET lease_until = now() - interval '1 minute'");
  expect((await flushNotifications()).sent).toBe(1);
  expect(mocks.send.mock.calls[1]).toEqual(firstCall);
  expect((await flushNotifications()).sent).toBe(0);
  expect(mocks.send).toHaveBeenCalledTimes(2);
 });
 it('does not retry an uncertain delivery beyond the provider idempotency window', async () => {
  await recordView(user, 'rtl', null);
  await database.exec("UPDATE notification_outbox SET first_attempt_at = now() - interval '24 hours'");
  expect((await flushNotifications()).sent).toBe(0);
  expect(mocks.send).not.toHaveBeenCalled();
 });
 it('creates another notification on a new UTC day', async () => {
  await recordView(user, 'rtl', null);
  await database.exec("UPDATE notification_outbox SET day = day - 1; UPDATE sample_views SET view_day = view_day - 1");
  await recordView(user, 'rtl', null);
  expect((await database.query('SELECT * FROM notification_outbox')).rows).toHaveLength(2);
 });
});
describe('view endpoint', () => {
 const request = (body: unknown, origin = 'https://samples.arcverex.io') => new Request('https://samples.arcverex.io/api/views', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
 it('rejects unauthenticated requests before writing anything', async () => {
  mocks.viewer.mockResolvedValueOnce(null);
  expect((await POST(request({ slug: 'rtl' }))).status).toBe(401);
  expect((await database.query('SELECT * FROM sample_views')).rows).toHaveLength(0);
 });
 it('rejects cross-origin requests', async () => {
  expect((await POST(request({ slug: 'rtl' }, 'https://evil.test'))).status).toBe(403);
  expect(mocks.viewer).not.toHaveBeenCalled();
 });
 it('rejects malformed sample IDs and oversized bodies', async () => {
  expect((await POST(request({ slug: '../private' }))).status).toBe(400);
  expect((await POST(request({ slug: 'x'.repeat(1100) }))).status).toBe(413);
 });
 it('uses server identity and referral, ignoring client impersonation', async () => {
  expect((await POST(request({ slug: 'rtl', email: 'fake@example.com', broker: 'fake' }))).status).toBe(204);
  const rows: any = (await database.query('SELECT * FROM sample_views')).rows;
  expect(rows[0].email).toBe('alice@example.com');
  expect(rows[0].broker).toBe('broker-one');
  expect(mocks.after).toHaveBeenCalledOnce();
 });
});
