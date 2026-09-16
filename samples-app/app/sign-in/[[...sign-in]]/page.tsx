import { SignIn } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { authConfigured } from '@/lib/config';
export default function Page() {
  if (!authConfigured()) redirect('/');
  return <div className="auth"><h1>Welcome to the collection.</h1><p>Verify your email to continue.</p><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/gallery" /></div>;
}
