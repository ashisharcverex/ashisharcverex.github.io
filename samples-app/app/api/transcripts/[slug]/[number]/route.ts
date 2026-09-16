import { viewer } from '@/lib/auth';
import { getTranscript } from '@/lib/transcripts';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; number: string }> }) {
  if (!await viewer()) return Response.json({ error: 'Sign in to read transcripts.' }, { status: 401, headers });
  const { slug, number } = await params;
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug) || !/^[1-9]\d{0,5}$/.test(number)) return Response.json({ error: 'Not found' }, { status: 404, headers });
  const transcript = await getTranscript(slug, Number(number));
  if (!transcript) return Response.json({ error: 'Not found' }, { status: 404, headers });
  return Response.json(transcript, { headers });
}
