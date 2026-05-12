import { type NextRequest } from 'next/server';
import { getConfig, saveConfig, getSafeConfig } from '@/lib/config';

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
  if (!(await verifyAdmin(request))) {
    return Response.json({ error: '密码错误' }, { status: 401 });
  }
  const config = await getConfig();
  const safe = getSafeConfig(config);
  return Response.json({
    ...safe,
    upstream: {
      ...safe.upstream,
      apiKeyMasked: config.upstream.apiKey
        ? config.upstream.apiKey.slice(0, 8) + '••••••••' + config.upstream.apiKey.slice(-4)
        : '',
    },
    adminPassword: '',
  });
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return Response.json({ error: '密码错误' }, { status: 401 });
  }
  try {
    const body = await request.json();

    const { newAdminPassword, upstreamApiKey, ...rest } = body as Record<string, unknown>;

    const updates: Record<string, unknown> = { ...rest };

    if (typeof newAdminPassword === 'string' && newAdminPassword.length >= 6) {
      updates.adminPassword = newAdminPassword;
    }

    if (typeof upstreamApiKey === 'string' && upstreamApiKey && !upstreamApiKey.includes('••')) {
      updates.upstream = {
        ...(typeof rest.upstream === 'object' && rest.upstream !== null ? rest.upstream : {}),
        apiKey: upstreamApiKey,
      };
    } else if (typeof rest.upstream === 'object' && rest.upstream !== null) {
      const u = rest.upstream as Record<string, unknown>;
      if (typeof u.apiKey === 'string' && !u.apiKey.includes('••')) {
        updates.upstream = { ...u, apiKey: u.apiKey };
      } else {
        const current = await getConfig();
        updates.upstream = { ...u, apiKey: current.upstream.apiKey };
      }
    }

    await saveConfig(updates as Parameters<typeof saveConfig>[0]);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
