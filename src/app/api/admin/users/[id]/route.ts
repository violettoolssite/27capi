import { type NextRequest } from 'next/server';
import { userDb } from '@/lib/db';
import { getConfig } from '@/lib/config';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const config = await getConfig();
  return token === config.adminPassword;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) return Response.json({ error: '密码错误' }, { status: 401 });
  const { id } = await params;

  const user = userDb.findById(id);
  if (!user) return Response.json({ error: '用户不存在' }, { status: 404 });

  let body: {
    balance?: number; balanceDelta?: number;
    status?: 'active' | 'suspended';
    role?: 'admin' | 'user';
    password?: string;
    email?: string;
  };
  try { body = await request.json(); } catch { return Response.json({ error: '格式错误' }, { status: 400 }); }

  const updates: Record<string, unknown> = {};
  if (typeof body.balance === 'number') updates.balance = Math.max(0, body.balance);
  if (typeof body.balanceDelta === 'number') updates.balance = Math.max(0, user.balance + body.balanceDelta);
  if (body.status === 'active' || body.status === 'suspended') updates.status = body.status;
  if (body.role === 'admin' || body.role === 'user') updates.role = body.role;
  if (typeof body.email === 'string') updates.email = body.email || null;
  if (body.password && body.password.length >= 6) {
    updates.passwordHash = await hashPassword(body.password);
  }

  const updated = userDb.update(id, updates as Parameters<typeof userDb.update>[1]);
  if (!updated) return Response.json({ error: '更新失败' }, { status: 500 });

  return Response.json({
    id: updated.id, username: updated.username, email: updated.email,
    role: updated.role, balance: updated.balance, status: updated.status,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) return Response.json({ error: '密码错误' }, { status: 401 });
  const { id } = await params;

  if (!userDb.findById(id)) return Response.json({ error: '用户不存在' }, { status: 404 });
  userDb.delete(id);
  return Response.json({ ok: true });
}
