import Link from 'next/link';
import { authConfigured } from '@/lib/config';

export default function Home() {
  return (
    <section className="landing">
      <h1>Samples</h1>
      <p className="lead">RL environments for hardware engineering.</p>
      {authConfigured() ? (
        <Link className="button" href="/gallery" prefetch={false}>View samples →</Link>
      ) : (
        <p className="notice">Coming soon.</p>
      )}
      <p className="fine">Email verification required. We record your email and sample views. <Link href="/privacy">Privacy</Link></p>
    </section>
  );
}
