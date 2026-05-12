import { type NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';
import { randomUUID } from 'crypto';
import { userDb } from '@/lib/db';
import { hashPassword, signToken, SESSION_COOKIE, cookieOptions } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import { sendVerificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const config = await getConfig();
  if (!config.registration.enabled) {
    return Response.json({ error: '当前不开放注册，请联系管理员' }, { status: 403 });
  }

  let body: { username?: string; email?: string; password?: string };
  try { body = await request.json(); } catch { return Response.json({ error: '请求格式错误' }, { status: 400 }); }

  const { username, password } = body;
  const email = body.email?.trim().toLowerCase() || null;

  if (!username || !password) return Response.json({ error: '用户名和密码为必填项' }, { status: 400 });
  if (username.length < 3 || username.length > 32 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    return Response.json({ error: '用户名 3-32 位，仅限字母数字下划线短横线' }, { status: 400 });
  }
  if (password.length < 6) return Response.json({ error: '密码至少 6 位' }, { status: 400 });

  // Email verification enabled: email required
  if (config.emailVerification.enabled && !email) {
    return Response.json({ error: '开启了邮箱验证，请填写邮箱地址' }, { status: 400 });
  }

  // Domain whitelist check
  if (email && config.emailVerification.whitelist.length > 0) {
    const domain = email.split('@')[1]?.toLowerCase() ?? '';
    const allowed = config.emailVerification.whitelist.map(d => d.toLowerCase().trim());
    if (!allowed.includes(domain)) {
      return Response.json({ error: `不支持该邮箱域名，允许：${allowed.join('、')}` }, { status: 400 });
    }
  }

  if (userDb.findByUsername(username)) return Response.json({ error: '用户名已被使用' }, { status: 409 });
  if (email && userDb.findByEmail(email)) return Response.json({ error: '邮箱已被注册' }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const needVerify = config.emailVerification.enabled && !!email;
  const verificationToken = needVerify ? randomUUID() : null;
  const verificationExpires = needVerify ? Date.now() + 24 * 3600 * 1000 : null;

  const user = userDb.create({
    username,
    email,
    passwordHash,
    role: 'user',
    balance: config.registration.defaultBalance,
    status: 'active',
    emailVerified: !needVerify,
    verificationToken,
    verificationExpires,
  });

  // Send verification email (fire-and-forget)
  if (needVerify && email && verificationToken) {
    const headersList = await headers();
    const host = headersList.get('host') ?? 'localhost:3000';
    const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    sendVerificationEmail(email, verificationToken, `${proto}://${host}`).catch(() => {});
    return Response.json({
      ok: true,
      requiresVerification: true,
      message: `注册成功！验证邮件已发送至 ${email}，请点击邮件中的链接完成验证后登录`,
    });
  }

  const token = signToken({ sub: user.id, username: user.username, role: user.role });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, cookieOptions());

  return Response.json({
    ok: true,
    user: { id: user.id, username: user.username, role: user.role, balance: user.balance },
  });
}
