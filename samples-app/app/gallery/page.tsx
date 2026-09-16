import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { listSamples } from '@/lib/samples';
export const dynamic = 'force-dynamic';
export default async function Gallery() {
  const samples = await listSamples();
  return <><div className="section-top"><p className="eyebrow">THE COLLECTION</p><UserButton /></div><h1>Environment samples.</h1><p className="lead">Explore the tasks, methods, and outcomes behind our hardware environments.</p>{samples.length ? <div className="grid">{samples.map(s => <Link prefetch={false} className="sample-card" href={'/gallery/' + s.slug} key={s.slug}><span className="eyebrow">{s.category}</span><h2>{s.title}</h2><p>{s.summary}</p><span>Explore sample →</span></Link>)}</div> : <section className="empty"><span className="empty-icon">[ &nbsp; ]</span><h2>More to explore, soon.</h2><p>We’re preparing the first samples for this collection.</p><a href="mailto:ashish@arcverex.io">Get in touch →</a></section>}</>;
}
