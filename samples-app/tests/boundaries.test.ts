import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ requireViewer: vi.fn(), db: vi.fn(), flush: vi.fn() }));
vi.mock('../lib/auth', () => ({ requireViewer: mocks.requireViewer }));
vi.mock('../lib/db', () => ({ db: mocks.db }));
vi.mock('../lib/notifications', () => ({ flushNotifications: mocks.flush }));
import { getSample, listSamples } from '../lib/samples';
import { GET as cron } from '../app/api/notifications/route';
import { GET as referral } from '../app/b/[broker]/route';
beforeEach(() => { vi.clearAllMocks(); process.env.APP_URL = 'https://samples.arcverex.io'; process.env.CRON_SECRET = 'test-secret'; });
describe('protected resources', () => {
 it('cannot read catalog or content when identity check fails', async () => {
  mocks.requireViewer.mockRejectedValue(new Error('Unauthorized'));
  await expect(listSamples()).rejects.toThrow('Unauthorized');
  await expect(getSample('private')).rejects.toThrow('Unauthorized');
  expect(mocks.db).not.toHaveBeenCalled();
 });
 it('rejects unauthenticated notification dispatch and missing cron configuration', async () => {
  expect((await cron(new Request('https://samples.arcverex.io/api/notifications'))).status).toBe(401);
  delete process.env.CRON_SECRET;
  expect((await cron(new Request('https://samples.arcverex.io/api/notifications', { headers: { authorization: 'Bearer undefined' } }))).status).toBe(401);
  expect(mocks.flush).not.toHaveBeenCalled();
 });
 it('dispatches only with matching scheduler secret', async () => {
  mocks.flush.mockResolvedValue({ sent: 1 });
  const response = await cron(new Request('https://samples.arcverex.io/api/notifications', { headers: { authorization: 'Bearer test-secret' } }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ sent: 1 });
 });
 it('stores broker attribution in a secure cookie and redirects to the canonical host', async () => {
  const response = await referral(new Request('https://wrong.test/b/partner'), { params: Promise.resolve({ broker: 'partner' }) });
  expect(response.headers.get('location')).toBe('https://samples.arcverex.io/');
  expect(response.headers.get('set-cookie')).toContain('arcverex_broker=partner');
  expect(response.headers.get('set-cookie')).toContain('HttpOnly');
  expect(response.headers.get('set-cookie')).toContain('Secure');
  expect(response.headers.get('cache-control')).toContain('no-store');
 });
 it('rejects invalid referral paths', async () => {
  expect((await referral(new Request('https://samples.arcverex.io/b/x'), { params: Promise.resolve({ broker: '../../x' }) })).status).toBe(404);
 });
});
