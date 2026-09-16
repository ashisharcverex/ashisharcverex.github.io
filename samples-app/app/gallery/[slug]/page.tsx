import { notFound } from 'next/navigation';
import { getSample } from '@/lib/samples';
import { ViewTracker } from '@/components/ViewTracker';
export const dynamic = 'force-dynamic';
export default async function Sample({ params }: { params: Promise<{ slug: string }> }) {
  const sample = await getSample((await params).slug);
  if (!sample) notFound();
  return <article><a href="/gallery">← All samples</a><p className="eyebrow">{sample.category}</p><h1>{sample.title}</h1><p className="lead">{sample.summary}</p><pre className="sample-body">{sample.body}</pre><ViewTracker slug={sample.slug} /></article>;
}
