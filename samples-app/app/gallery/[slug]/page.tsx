import { notFound } from 'next/navigation';
import { getSample } from '@/lib/samples';
import { sampleMethodology, splitSampleBody } from '@/lib/sample-methodology';
import { ViewTracker } from '@/components/ViewTracker';
export const dynamic = 'force-dynamic';
export default async function Sample({ params }: { params: Promise<{ slug: string }> }) {
  const sample = await getSample((await params).slug);
  if (!sample) notFound();
  const content = splitSampleBody(sample.body);
  const methodology = sampleMethodology[sample.slug];
  return (
    <article>
      <a href="/gallery">← All samples</a>
      <p className="eyebrow">{sample.category}</p>
      <h1>{sample.title}</h1>
      <p className="lead">{sample.summary}</p>
      <p className="fine">Historical pass rates from saved closed-network runs using Claude Opus 5 and Claude Code 2.1.197.</p>
      {methodology && <section className="sample-methodology" aria-label="Grading and quality assurance">
        <div><h2>How it’s graded</h2><p>{methodology.grading}</p></div>
        <div><h2>QA checks</h2><p>{methodology.qa}</p></div>
        <p className="fine">These describe the grading and QA methods. The historical rates are not a new QA run or certification of verifier isolation.</p>
      </section>}
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
