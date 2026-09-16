import { SignUp } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { authConfigured } from '@/lib/config';

export default function Page() {
  if (!authConfigured()) redirect('/');
  return <div className="auth"><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/gallery" /><p className="fine">We record your email and sample views. <a href="/privacy">Privacy</a></p></div>;
}
