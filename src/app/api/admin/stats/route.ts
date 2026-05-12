import { type NextRequest } from 'next/server';
import { getGlobalStats, readUsageLogs } from '@/lib/db';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const config = await getConfig();
  if (!token || token !== config.adminPassword) {
    return Response.json({ error: '密码错误' }, { status: 401 });
  }

  const stats = getGlobalStats();
  const { logs } = readUsageLogs({ limit: 20 });

  return Response.json({ ...stats, recentLogs: logs });
}
