import { after } from 'next/server';
import { cookies } from 'next/headers';
import { viewer } from '@/lib/auth';
import { brokerSlug, sameOrigin } from '@/lib/policy';
import { appUrl } from '@/lib/config';
import { recordView } from '@/lib/tracking';
import { flushNotifications } from '@/lib/notifications';
export async function POST(request: Request) {
  if (!sameOrigin(request.headers.get('origin'), appUrl().href)) return new Response('Forbidden', { status: 403 });
  const user = await viewer();
  if (!user) return new Response('Unauthorized', { status: 401 });
  if (Number(request.headers.get('content-length') || 0) > 1024) return new Response('Too large', { status: 413 });
  const raw = await request.text();
  if (raw.length > 1024) return new Response('Too large', { status: 413 });
  let slug: string | null;
  try { slug = brokerSlug(JSON.parse(raw).slug); } catch { return new Response('Invalid request', { status: 400 }); }
  if (!slug) return new Response('Invalid sample', { status: 400 });
  const broker = brokerSlug((await cookies()).get('arcverex_broker')?.value);
  const found = await recordView(user, slug, broker);
  if (!found) return new Response('Not found', { status: 404 });
  after(async () => { await flushNotifications(); });
  return new Response(null, { status: 204 });
}
