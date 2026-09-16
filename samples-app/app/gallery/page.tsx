import { environments } from '@/lib/environments';
import Link from 'next/link';
import { PassRate, parsePassRate } from '@/components/PassRate';
import { UserButton } from '@clerk/nextjs';
import { listSamples } from '@/lib/samples';

export const dynamic = 'force-dynamic';

export default async function Gallery() {
  const samples = await listSamples();
  return (
    <>
      <div className="section-top"><p className="eyebrow">THE COLLECTION</p><UserButton /></div>
      <h1>Environments</h1>
      {samples.length ? (
        <div className="grid">
          {samples.map(sample => {
            const { description, rate } = parsePassRate(sample.summary);
            const environment = environments[sample.category];
            return (
            <Link prefetch={false} className="sample-card" href={'/gallery/' + sample.slug} key={sample.slug}>
              <span className="eyebrow">RL ENVIRONMENT</span>
              <h2>{environment?.title ?? sample.category}</h2>
              <p>{environment?.description ?? description}</p>
              <p className="fine">Sample task: {sample.title}</p>
              {rate && <PassRate {...rate} />}
              <span>Explore environment →</span>
            </Link>
          ); })}
        </div>
      ) : (
        <section className="empty"><span className="empty-icon" aria-hidden="true">[ &nbsp; ]</span><h2>Samples coming soon.</h2><a href="mailto:ashish@arcverex.io">Contact →</a></section>
      )}
    </>
  );
}
