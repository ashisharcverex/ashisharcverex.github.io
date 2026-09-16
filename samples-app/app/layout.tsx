import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { authConfigured } from '@/lib/config';
import './globals.css';
export const metadata: Metadata = { title: 'Samples | Arcverex', description: 'Explore reinforcement learning environments for hardware engineering.', robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) {
  const body = <html lang="en"><body><header><a className="brand" href="https://arcverex.io">arcverex<span className="brand-mark">↗</span></a><a href="/">Environment samples</a></header><main>{children}</main><footer><span>Training AI for hardware design.</span><a href="/privacy">Privacy & access</a><a href="mailto:ashish@arcverex.io">Contact</a></footer></body></html>;
  return authConfigured() ? <ClerkProvider>{body}</ClerkProvider> : body;
}
