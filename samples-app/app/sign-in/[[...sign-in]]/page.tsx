import { SignIn } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { authConfigured } from '@/lib/config';

export default function Page() {
  if (!authConfigured()) redirect('/');
  return <div className="auth"><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/gallery" /><p className="fine">We record your email and sample views. <a href="/privacy">Privacy</a></p></div>;
}
