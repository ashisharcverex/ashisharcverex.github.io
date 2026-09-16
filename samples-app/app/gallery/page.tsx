import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { listSamples } from '@/lib/samples';

export const dynamic = 'force-dynamic';

export default async function Gallery() {
  const samples = await listSamples();
  return (
    <>
      <div className="section-top"><h1>Samples</h1><UserButton /></div>
      {samples.length ? (
        <div className="grid">
          {samples.map(sample => (
            <Link prefetch={false} className="sample-card" href={'/gallery/' + sample.slug} key={sample.slug}>
              <span className="eyebrow">{sample.category}</span>
              <h2>{sample.title} →</h2>
              <p>{sample.summary}</p>
            </Link>
          ))}
        </div>
      ) : (
        <section className="empty"><h2>Samples coming soon.</h2></section>
      )}
    </>
  );
}
