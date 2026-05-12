import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
  return Response.json({ ok: true });
}
