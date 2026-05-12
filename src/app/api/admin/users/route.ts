import { type NextRequest } from 'next/server';
import { userDb, apiKeyDb } from '@/lib/db';
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

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) return Response.json({ error: '密码错误' }, { status: 401 });

  const users = userDb.all().map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    balance: u.balance,
    status: u.status,
    keyCount: apiKeyDb.listForUser(u.id).length,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  return Response.json(users);
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) return Response.json({ error: '密码错误' }, { status: 401 });

  let body: {
    username?: string; email?: string; password?: string;
    role?: 'admin' | 'user'; balance?: number;
  };
  try { body = await request.json(); } catch { return Response.json({ error: '格式错误' }, { status: 400 }); }

  const { username, email, password, role = 'user', balance = 0 } = body;
  if (!username || !password) return Response.json({ error: '用户名和密码必填' }, { status: 400 });
  if (userDb.findByUsername(username)) return Response.json({ error: '用户名已存在' }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const user = userDb.create({ username, email: email || null, passwordHash, role, balance, status: 'active' });

  return Response.json({ ok: true, id: user.id });
}
