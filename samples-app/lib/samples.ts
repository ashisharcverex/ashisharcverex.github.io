import 'server-only';
import { db } from './db';
import { requireViewer } from './auth';
export type Sample = { slug: string; title: string; summary: string; category: string; body: string };
export async function listSamples() {
  await requireViewer();
  return db()<Pick<Sample, 'slug' | 'title' | 'summary' | 'category'>[]>`
    SELECT slug, title, summary, category FROM samples WHERE published = true ORDER BY title`;
}
export async function getSample(slug: string) {
  await requireViewer();
  const rows = await db()<Sample[]>`SELECT slug, title, summary, category, body FROM samples WHERE slug = ${slug} AND published = true`;
  return rows[0];
}
