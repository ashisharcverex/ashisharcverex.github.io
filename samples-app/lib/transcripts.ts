import 'server-only';
import { db } from './db';
import { requireViewer } from './auth';
export type TranscriptEntry = { rollout_number: number; passed: boolean };
const selectedRollouts = new Map<string, readonly number[]>([
  ['sv-testbench-apb-registers', [7, 1, 2, 9]],
  ['rtl-design-credit-flow', [3, 1, 5]],
  ['rtl-debug-accumulator', [6, 1, 3, 4]],
]);
export async function listTranscripts(slug: string) {
  await requireViewer();
  const selected = selectedRollouts.get(slug);
  if (!selected) return [];
  const rows = await db()<TranscriptEntry[]>`SELECT t.rollout_number, t.passed FROM sample_transcripts t
    JOIN samples s ON s.slug = t.sample_slug
    WHERE s.slug = ${slug} AND s.published = true ORDER BY t.rollout_number`;
  return selected.flatMap(number => rows.filter(row => row.rollout_number === number));
}
export async function getTranscript(slug: string, number: number) {
  await requireViewer();
  if (!selectedRollouts.get(slug)?.includes(number)) return undefined;
  const rows = await db()<{ body: string }[]>`SELECT t.body FROM sample_transcripts t
    JOIN samples s ON s.slug = t.sample_slug
    WHERE s.slug = ${slug} AND s.published = true AND t.rollout_number = ${number}`;
  return rows[0];
}
