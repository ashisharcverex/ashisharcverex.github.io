import 'server-only';
import { db } from './db';
import { requireViewer } from './auth';
export type TranscriptEntry = { rollout_number: number; passed: boolean; failure_title?: string };
const selectedRollouts = new Map<string, readonly number[]>([
  ['sv-testbench-apb-registers', [7, 1, 2, 9]],
  ['rtl-design-credit-flow', [3, 1, 5]],
  ['rtl-debug-accumulator', [6, 1, 3, 4]],
]);
const failureTitles = new Map<string, string>([
  ['sv-testbench-apb-registers:1', 'Idle glitches missed'],
  ['sv-testbench-apb-registers:2', 'Reset timing missed'],
  ['sv-testbench-apb-registers:9', 'Setup sequence missed'],
  ['rtl-design-credit-flow:1', 'Look-ahead arbitration'],
  ['rtl-design-credit-flow:5', 'Grant/credit timing'],
  ['rtl-debug-accumulator:1', 'Early completion'],
  ['rtl-debug-accumulator:3', 'Relaunch timing mismatch'],
  ['rtl-debug-accumulator:4', 'Combinational busy'],
]);
export async function listTranscripts(slug: string) {
  await requireViewer();
  const selected = selectedRollouts.get(slug);
  if (!selected) return [];
  const rows = await db()<TranscriptEntry[]>`SELECT t.rollout_number, t.passed FROM sample_transcripts t
    JOIN samples s ON s.slug = t.sample_slug
    WHERE s.slug = ${slug} AND s.published = true ORDER BY t.rollout_number`;
  return selected.flatMap(number => rows.filter(row => row.rollout_number === number))
    .map(row => ({ ...row, failure_title: row.passed ? undefined : failureTitles.get(`${slug}:${row.rollout_number}`) }));
}
export async function getTranscript(slug: string, number: number) {
  await requireViewer();
  if (!selectedRollouts.get(slug)?.includes(number)) return undefined;
  const rows = await db()<{ body: string }[]>`SELECT t.body FROM sample_transcripts t
    JOIN samples s ON s.slug = t.sample_slug
    WHERE s.slug = ${slug} AND s.published = true AND t.rollout_number = ${number}`;
  return rows[0];
}
