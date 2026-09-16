import Link from 'next/link';
import { authConfigured } from '@/lib/config';

export default function Home() {
  return (
    <div className="landing">
      <section>
        <p className="eyebrow">ENVIRONMENT SAMPLES</p>
        <h1>Hardware tasks.<br /><span>RL environments.</span></h1>
        <div className="topics"><span>RTL design</span><span>Verification</span><span>Debugging</span></div>
      </section>
      <aside className="access-card">
        <span className="step">01 / ACCESS</span>
        <h2>Verify your email.</h2>
        <p>No password needed.</p>
        {authConfigured() ? (
          <Link className="button" href="/gallery" prefetch={false}>View samples <span>→</span></Link>
        ) : (
          <div className="notice">Coming soon.</div>
        )}
        <p className="fine">We record your email and sample views. <Link href="/privacy">Privacy</Link></p>
      </aside>
    </div>
  );
}
