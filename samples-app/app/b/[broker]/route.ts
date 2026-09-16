import { NextResponse } from 'next/server';
import { brokerSlug } from '@/lib/policy';
import { appUrl } from '@/lib/config';
export async function GET(_request: Request, { params }: { params: Promise<{ broker: string }> }) {
  const broker = brokerSlug((await params).broker);
  if (!broker) return new Response('Not found', { status: 404 });
  const response = NextResponse.redirect(new URL('/', appUrl()));
  response.headers.set('Cache-Control', 'private, no-store');
  response.cookies.set('arcverex_broker', broker, {
    httpOnly: true, sameSite: 'lax', secure: appUrl().protocol === 'https:', maxAge: 60 * 60 * 24 * 30, path: '/',
  });
  return response;
}
