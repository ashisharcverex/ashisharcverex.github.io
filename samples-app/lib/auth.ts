import 'server-only';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { authConfigured } from './config';
import { verifiedEmail } from './policy';
export async function viewer() {
  if (!authConfigured()) return null;
  const user = await currentUser();
  const email = verifiedEmail(user);
  return user && email ? { id: user.id, email } : null;
}
export async function requireViewer() {
  if (!authConfigured()) redirect('/');
  const user = await viewer();
  if (!user) redirect('/sign-in');
  return user;
}
