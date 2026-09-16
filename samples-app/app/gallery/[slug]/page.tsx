import { environments } from '@/lib/environments';
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
  const environment = environments[sample.category];
  const content = splitSampleBody(sample.body);
  return (
    <article>
      <a href="/gallery">← All environments</a>
      <p className="eyebrow">RL ENVIRONMENT</p>
      <h1>{environment?.title ?? sample.category}</h1>
      <p className="lead">{environment?.description ?? description}</p>
      {environment && <div className="environment-flow" aria-label="Environment input and deliverable">
        <div><span className="eyebrow">GIVEN</span><span>{environment.input}</span></div>
        <span className="environment-arrow" aria-hidden="true">→</span>
        <div><span className="eyebrow">AGENT BUILDS</span><span>{environment.output}</span></div>
      </div>}
      <p className="fine">Sample task: {sample.title}</p>
      {rate && <div className="detail-rate"><PassRate {...rate} /></div>}
      <SampleDiagrams slug={sample.slug} />
      <details className="sample-section">
        <summary>Sample task prompt · {sample.title}</summary>
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
