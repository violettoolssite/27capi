import { type NextRequest } from 'next/server';
import { getConfig } from '@/lib/config';
import { sendTestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const config = await getConfig();
  if (!token || token !== config.adminPassword) {
    return Response.json({ error: '密码错误' }, { status: 401 });
  }
  let body: { to?: string };
  try { body = await request.json(); } catch { body = {}; }
  const to = body.to || config.smtp.user;
  if (!to) return Response.json({ error: '请先配置 SMTP 用户名或指定收件邮箱' }, { status: 400 });
  const result = await sendTestEmail(to);
  if (!result.ok) return Response.json({ error: result.error }, { status: 500 });
  return Response.json({ ok: true, message: `测试邮件已发送至 ${to}` });
}
