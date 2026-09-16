import 'server-only';
import { db } from './db';
import { requireViewer } from './auth';
export type TranscriptEntry = { rollout_number: number; passed: boolean };
export async function listTranscripts(slug: string) {
  await requireViewer();
  return db()<TranscriptEntry[]>`SELECT t.rollout_number, t.passed FROM sample_transcripts t
    JOIN samples s ON s.slug = t.sample_slug
    WHERE s.slug = ${slug} AND s.published = true ORDER BY t.rollout_number`;
}
export async function getTranscript(slug: string, number: number) {
  await requireViewer();
  const rows = await db()<{ body: string }[]>`SELECT t.body FROM sample_transcripts t
    JOIN samples s ON s.slug = t.sample_slug
    WHERE s.slug = ${slug} AND s.published = true AND t.rollout_number = ${number}`;
  return rows[0];
}
