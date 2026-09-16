import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { listSamples } from '@/lib/samples';

export const dynamic = 'force-dynamic';

export default async function Gallery() {
  const samples = await listSamples();
  return (
    <>
      <div className="section-top"><p className="eyebrow">THE COLLECTION</p><UserButton /></div>
      <h1>Samples</h1>
      {samples.length ? (
        <div className="grid">
          {samples.map(sample => (
            <Link prefetch={false} className="sample-card" href={'/gallery/' + sample.slug} key={sample.slug}>
              <span className="eyebrow">{sample.category}</span>
              <h2>{sample.title}</h2>
              <p>{sample.summary}</p>
              <span>View →</span>
            </Link>
          ))}
        </div>
      ) : (
        <section className="empty"><span className="empty-icon" aria-hidden="true">[ &nbsp; ]</span><h2>Samples coming soon.</h2><a href="mailto:ashish@arcverex.io">Contact →</a></section>
      )}
    </>
  );
}
