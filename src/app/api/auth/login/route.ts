import { type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { userDb } from '@/lib/db';
import { verifyPassword, signToken, SESSION_COOKIE, cookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try { body = await request.json(); } catch { return Response.json({ error: '请求格式错误' }, { status: 400 }); }

  const { username, password } = body;
  if (!username || !password) {
    return Response.json({ error: '请填写用户名和密码' }, { status: 400 });
  }

  const user = userDb.findByUsername(username);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: '用户名或密码错误' }, { status: 401 });
  }
  if (user.status === 'suspended') {
    return Response.json({ error: '账号已被禁用，请联系管理员' }, { status: 403 });
  }
  if (!user.emailVerified) {
    return Response.json({ error: '邮箱尚未验证，请查收注册时发送的验证邮件', code: 'email_unverified' }, { status: 403 });
  }

  const token = signToken({ sub: user.id, username: user.username, role: user.role });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, cookieOptions());

  return Response.json({
    ok: true,
    user: { id: user.id, username: user.username, role: user.role, balance: user.balance },
  });
}
