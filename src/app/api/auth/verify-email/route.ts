import { type NextRequest } from 'next/server';
import { userDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return Response.json({ error: '无效链接' }, { status: 400 });

  const user = userDb.findByVerificationToken(token);
  if (!user) return Response.json({ error: '验证链接无效或已使用' }, { status: 400 });

  if (user.verificationExpires && user.verificationExpires < Date.now()) {
    return Response.json({ error: '验证链接已过期，请重新注册或联系管理员' }, { status: 400 });
  }

  userDb.update(user.id, {
    emailVerified: true,
    verificationToken: null,
    verificationExpires: null,
  });

  return Response.json({ ok: true, username: user.username });
}
