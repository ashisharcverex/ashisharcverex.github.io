import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ viewer: vi.fn(), requireViewer: vi.fn(), db: vi.fn() }));
vi.mock('../lib/auth', () => ({ viewer: mocks.viewer, requireViewer: mocks.requireViewer }));
vi.mock('../lib/db', () => ({ db: mocks.db }));
import { listTranscripts, getTranscript } from '../lib/transcripts';
import { GET } from '../app/api/transcripts/[slug]/[number]/route';
const request = new Request('https://samples.arcverex.io/api/transcripts/example/1');
const context = (number = '1') => ({ params: Promise.resolve({ slug: 'example', number }) });
beforeEach(() => vi.resetAllMocks());
describe('transcript access', () => {
  it('does not query transcripts without a verified viewer', async () => {
    mocks.requireViewer.mockRejectedValue(new Error('Unauthorized'));
    await expect(listTranscripts('example')).rejects.toThrow('Unauthorized');
    await expect(getTranscript('example', 1)).rejects.toThrow('Unauthorized');
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it('returns an uncacheable 401 before reading content', async () => {
    mocks.viewer.mockResolvedValue(null);
    const response = await GET(request, context());
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it('rejects malformed rollout numbers', async () => {
    mocks.viewer.mockResolvedValue({ id: 'verified' });
    expect((await GET(request, context('1 OR 1=1'))).status).toBe(404);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it('returns 404 for unavailable or unpublished transcripts', async () => {
    mocks.viewer.mockResolvedValue({ id: 'verified' });
    mocks.db.mockReturnValue(vi.fn().mockResolvedValue([]));
    expect((await GET(request, context())).status).toBe(404);
  });
  it('serves protected content without shared caching', async () => {
    mocks.viewer.mockResolvedValue({ id: 'verified' });
    mocks.db.mockReturnValue(vi.fn().mockResolvedValue([{ body: 'Saved transcript' }]));
    const response = await GET(request, context());
    expect(await response.json()).toEqual({ body: 'Saved transcript' });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mocks.requireViewer).toHaveBeenCalled();
  });
});
