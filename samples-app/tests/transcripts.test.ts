import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ viewer: vi.fn(), requireViewer: vi.fn(), db: vi.fn() }));
vi.mock('../lib/auth', () => ({ viewer: mocks.viewer, requireViewer: mocks.requireViewer }));
vi.mock('../lib/db', () => ({ db: mocks.db }));
import { listTranscripts, getTranscript } from '../lib/transcripts';
import { GET } from '../app/api/transcripts/[slug]/[number]/route';
const request = new Request('https://samples.arcverex.io/api/transcripts/example/1');
const context = (number = '1') => ({ params: Promise.resolve({ slug: 'sv-testbench-apb-registers', number }) });
beforeEach(() => vi.resetAllMocks());
describe('transcript access', () => {
  it('hides unselected transcripts even when requested directly', async () => {
    mocks.viewer.mockResolvedValue({ id: 'verified' });
    expect((await GET(request, context('10'))).status).toBe(404);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it.each([
    ['sv-testbench-vu-meter', [1, 5, 4, 2]],
    ['sv-testbench-dictionary-coder', [9, 8, 3, 1]],
    ['postsilicon-axiom-dual-queue', [8, 4, 9, 3, 2]],
    ['sv-testbench-rational-evaluator', [3, 2, 9, 10, 4, 1]],
    ['sv-testbench-apb-registers', [7, 1, 2, 9]],
    ['sv-testbench-knock-lock', [22, 14, 23, 24, 25]],
    ['rtl-design-credit-flow', [3, 1, 5]],
    ['rtl-debug-accumulator', [6, 1, 3, 4]],
    ['rtl-debug-ot-backpressure', [7, 1]],
  ] as const)('lists only selected examples, passing first, for %s', async (slug, selected) => {
    mocks.db.mockReturnValue(vi.fn().mockResolvedValue(Array.from({length:26}, (_,i) => ({rollout_number:i+1,passed:i+1===selected[0]}))));
    const rows = await listTranscripts(slug);
    expect(rows.map(r => r.rollout_number)).toEqual(selected);
    expect(rows[0].passed).toBe(true);
  });

  it('numbers the ten debug runs from zero and labels the selected failure', async () => {
    mocks.db.mockReturnValue(vi.fn().mockResolvedValue([{ rollout_number: 1, passed: false }, { rollout_number: 7, passed: true }]));
    const rows = await listTranscripts('rtl-debug-ot-backpressure');
    expect(rows.map(r => r.display_number)).toEqual([6, 0]);
    expect(rows[1].failure_title).toBe('Alert logic detour');
    expect(await getTranscript('rtl-debug-ot-backpressure', 2)).toBeUndefined();
  });

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

it('attaches mechanisms to rational runs and keeps passing transcripts unlabelled', async () => {
  mocks.db.mockReturnValue(vi.fn().mockResolvedValue([{rollout_number:2,passed:false},{rollout_number:3,passed:true},{rollout_number:10,passed:false}]));
  const rows = await listTranscripts('sv-testbench-rational-evaluator');
  expect(rows[0].failure_modes).toEqual([]);
  expect(rows[1].failure_modes?.map(m => m.id)).toEqual(['destructive-read']);
  expect(rows[2].failure_modes?.map(m => m.id)).toEqual(['destructive-read','state-masking','idle-duration','reset-observation']);
});

it('hides duplicate rational examples and labels each selected failure by its featured mode', async () => {
  mocks.db.mockReturnValue(vi.fn().mockResolvedValue(Array.from({length:10}, (_,i) => ({rollout_number:i+1,passed:[3,6].includes(i+1)}))));
  const rows = await listTranscripts('sv-testbench-rational-evaluator');
  expect(rows.filter(r => r.passed)).toHaveLength(1);
  expect(rows.filter(r => !r.passed).map(r => r.failure_title)).toEqual(['Reset probe overwrites evidence','Setup masks reset state','Insufficient idle duration','Reset timing not observed','Busy requests omitted']);
  mocks.db.mockClear();
  for (const number of [5,6,7,8]) expect(await getTranscript('sv-testbench-rational-evaluator',number)).toBeUndefined();
  expect(mocks.db).not.toHaveBeenCalled();
});

it('labels Axiom mechanisms and excludes unselected runs', async () => {
  mocks.db.mockReturnValue(vi.fn().mockResolvedValue([{rollout_number:8,passed:true},{rollout_number:4,passed:false},{rollout_number:9,passed:false},{rollout_number:3,passed:false},{rollout_number:2,passed:false}]));
  const rows = await listTranscripts('postsilicon-axiom-dual-queue');
  expect(rows.map(r => r.rollout_number)).toEqual([8,4,9,3,2]);
  expect(rows[0].failure_title).toBeUndefined();
  expect(rows[1].failure_modes?.[0].id).toBe('reset-salvage');
  expect(rows[2].failure_modes?.[0].id).toBe('cached-readiness');
  expect(rows[3].failure_title).toBe('Completion before write retirement');
  expect(rows[4].failure_title).toBe('Polling an invalidated acknowledgement');
  expect(await getTranscript('postsilicon-axiom-dual-queue', 1)).toBeUndefined();
});

it('selects three continuous PPA outcomes and hides other transcripts', async () => {
  mocks.db.mockReturnValue(vi.fn().mockResolvedValue([3,7,14].map(n => ({rollout_number:n,passed:true}))));
  const rows = await listTranscripts('ppa-priority-selector');
  expect(rows.map(r => r.rollout_number)).toEqual([3,7,14]);
  expect(rows.map(r => r.display_number)).toEqual([3,6,10]);
  expect(rows[0].outcome_title).toContain('Modest improvement');
  expect(rows[2].outcome_title).toContain('0.491');
  expect(await getTranscript('ppa-priority-selector', 1)).toBeUndefined();
});

it('selects one VU pass and one unique rollout per observed failure mode', async () => {
  mocks.db.mockReturnValue(vi.fn().mockResolvedValue(Array.from({length:10}, (_,i) => ({rollout_number:i+1,passed:i===0}))));
  const rows = await listTranscripts('sv-testbench-vu-meter');
  expect(rows.map(r=>r.rollout_number)).toEqual([1,5,4,2]);
  expect(rows[0].failure_modes).toEqual([]);
  expect(rows.filter(r=>!r.passed).map(r=>r.failure_title)).toEqual(['Coverage without a distinguishing state (DUT specific)','Insufficient uninterrupted idle','Reset timing not observed']);
  expect(rows[1].failure_modes?.map(m=>m.id)).toEqual(['nondistinguishing-coverage','idle-duration']);
  mocks.db.mockClear();
  for (const n of [3,6,7,8,9,10]) expect(await getTranscript('sv-testbench-vu-meter',n)).toBeUndefined();
  expect(mocks.db).not.toHaveBeenCalled();
});

it('selects one dictionary pass and one distinct rollout per observed mechanism', async () => {
  mocks.db.mockReturnValue(vi.fn().mockResolvedValue(Array.from({length:10}, (_,i) => ({rollout_number:i+1,passed:i===8}))));
  const rows = await listTranscripts('sv-testbench-dictionary-coder');
  expect(rows.map(r=>r.rollout_number)).toEqual([9,8,3,1]);
  expect(rows[0].failure_modes).toEqual([]);
  expect(rows.filter(r=>!r.passed).map(r=>r.failure_title)).toEqual(['Wrong boundary coverage (DUT specific)','Insufficient uninterrupted idle','Reset timing not observed']);
  expect(rows[1].failure_modes?.map(m=>m.id)).toEqual(['boundary-conjunction','idle-duration','reset-observation']);
  expect(rows[1].failure_modes?.[0].detail).toContain('remains unresolved');
  mocks.db.mockClear();
  for (const n of [2,4,5,6,7,10]) expect(await getTranscript('sv-testbench-dictionary-coder',n)).toBeUndefined();
  expect(mocks.db).not.toHaveBeenCalled();
});

it('shows the DALI pass and distinct failures, with reset timing last', async () => {
  mocks.db.mockReturnValue(vi.fn().mockResolvedValue(Array.from({length:20}, (_,i) => ({rollout_number:i+1,passed:i===18}))));
  const rows = await listTranscripts('sv-testbench-dali-gear');
  expect(rows.map(r=>r.rollout_number)).toEqual([19,1,10,2,11,13,6,3]);
  expect(rows[0].failure_modes).toEqual([]);
  expect(rows.at(-1)?.failure_title).toBe('Reset checked too late');
  const ids = new Set(rows.flatMap(r=>r.failure_modes?.map(m=>m.id) ?? []));
  expect(ids.size).toBe(8);
  for (const row of rows.filter(r=>!r.passed)) expect(row.failure_modes?.at(-1)?.id).toBe('reset-observation');
});
