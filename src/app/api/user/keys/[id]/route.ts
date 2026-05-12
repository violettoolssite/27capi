import { type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { apiKeyDb } from '@/lib/db';
import { verifyToken, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const key = apiKeyDb.findById(id);
  if (!key || key.userId !== user.sub) {
    return Response.json({ error: '不存在或无权限' }, { status: 404 });
  }

  let body: { status?: 'active' | 'disabled'; name?: string };
  try { body = await request.json(); } catch { body = {}; }

  const updates: { status?: 'active' | 'disabled'; name?: string } = {};
  if (body.status === 'active' || body.status === 'disabled') updates.status = body.status;
  if (body.name) updates.name = body.name.slice(0, 64);

  const updated = apiKeyDb.update(id, updates);
  return Response.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ok = apiKeyDb.delete(id, user.sub);
  if (!ok) return Response.json({ error: '不存在或无权限' }, { status: 404 });

  return Response.json({ ok: true });
}
