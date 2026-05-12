import { type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { readUsageLogs } from '@/lib/db';
import { verifyToken, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return Response.json({ error: 'Session expired' }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);
  const offset = Number(url.searchParams.get('offset') || 0);

  const { logs, total } = readUsageLogs({ userId: payload.sub, limit, offset });
  return Response.json({ logs, total, limit, offset });
}
