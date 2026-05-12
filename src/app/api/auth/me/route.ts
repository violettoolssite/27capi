import { cookies } from 'next/headers';
import { userDb } from '@/lib/db';
import { verifyToken, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return Response.json({ error: 'Session expired' }, { status: 401 });

  const user = userDb.findById(payload.sub);
  if (!user || user.status === 'suspended') {
    return Response.json({ error: 'Account unavailable' }, { status: 403 });
  }

  return Response.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    balance: user.balance,
    status: user.status,
    createdAt: user.createdAt,
  });
}
