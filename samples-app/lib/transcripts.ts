import 'server-only';
import { db } from './db';
import { requireViewer } from './auth';
export type TranscriptEntry = { rollout_number: number; passed: boolean; failure_title?: string; missed_checks?: string[] };
const selectedRollouts = new Map<string, readonly number[]>([
  ['sv-testbench-apb-registers', [7, 1, 2, 9]],
  ['sv-testbench-knock-lock', [22, 14, 23, 24, 25]],
  ['rtl-design-credit-flow', [3, 1, 5]],
  ['rtl-debug-accumulator', [6, 1, 3, 4]],
]);
const missedChecks = new Map<string, string[]>([["sv-testbench-knock-lock:14", ["Idle view stability", "Candidate cleared by reset", "Failure count after reset", "Restart discards recording"]], ["sv-testbench-knock-lock:23", ["Confirmation length match", "Confirmation tolerance", "Candidate cleared by reset", "Restart discards recording", "Candidate survives short recording"]], ["sv-testbench-knock-lock:24", ["Confirmed pattern length updates"]], ["sv-testbench-knock-lock:25", ["Candidate survives lockout", "Minimum recording length", "Reset edge timing", "Candidate survives short recording"]]]);
const failureTitles = new Map<string, string>([
  ['sv-testbench-knock-lock:14', 'Reset & idle coverage'],
  ['sv-testbench-knock-lock:23', 'Confirmation checks'],
  ['sv-testbench-knock-lock:24', 'Pattern length update'],
  ['sv-testbench-knock-lock:25', 'Short recordings & lockout'],
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
    .map(row => ({ ...row, missed_checks: missedChecks.get(`${slug}:${row.rollout_number}`), failure_title: row.passed ? undefined : failureTitles.get(`${slug}:${row.rollout_number}`) }));
}
export async function getTranscript(slug: string, number: number) {
  await requireViewer();
  if (!selectedRollouts.get(slug)?.includes(number)) return undefined;
  const rows = await db()<{ body: string }[]>`SELECT t.body FROM sample_transcripts t
    JOIN samples s ON s.slug = t.sample_slug
    WHERE s.slug = ${slug} AND s.published = true AND t.rollout_number = ${number}`;
  return rows[0];
}
