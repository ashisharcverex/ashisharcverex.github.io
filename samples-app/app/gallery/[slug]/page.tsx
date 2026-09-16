import { PassRate, parsePassRate } from '@/components/PassRate';
import { notFound } from 'next/navigation';
import { getSample } from '@/lib/samples';
import { SampleDiagrams } from '@/components/SampleDiagrams';
import { splitSampleBody } from '@/lib/sample-methodology';
import { ViewTracker } from '@/components/ViewTracker';
export const dynamic = 'force-dynamic';
export default async function Sample({ params }: { params: Promise<{ slug: string }> }) {
  const sample = await getSample((await params).slug);
  if (!sample) notFound();
  const { description, rate } = parsePassRate(sample.summary);
  const content = splitSampleBody(sample.body);
  return (
    <article>
      <a href="/gallery">← All samples</a>
      <p className="eyebrow">{sample.category}</p>
      <h1>{sample.title}</h1>
      <p className="lead">{description}</p>
      {rate && <div className="detail-rate"><PassRate {...rate} /></div>}
      <SampleDiagrams slug={sample.slug} />
      <details className="sample-section">
        <summary>Task prompt</summary>
        <pre className="sample-body">{content.prompt}</pre>
      </details>
      {content.rtl && <details className="sample-section">
        <summary>Provided RTL</summary>
        <p className="fine">{content.rtlPath}</p>
        <pre className="sample-body">{content.rtl}</pre>
      </details>}
      <ViewTracker slug={sample.slug} />
    </article>
  );
}
