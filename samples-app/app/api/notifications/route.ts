import { timingSafeEqual } from 'node:crypto';
import { flushNotifications } from '@/lib/notifications';
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  const actualBytes = Buffer.from(header);
  const expectedBytes = Buffer.from(expected);
  if (!secret || actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    return new Response('Unauthorized', { status: 401 });
  }
  return Response.json(await flushNotifications(), { headers: { 'Cache-Control': 'no-store' } });
}
