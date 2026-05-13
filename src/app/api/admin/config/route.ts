import { type NextRequest } from 'next/server';
import { getConfig, saveConfig, getSafeConfig, type UpstreamChannel } from '@/lib/config';

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
  return Response.json({ ...safe, adminPassword: '' });
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return Response.json({ error: '密码错误' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { newAdminPassword, upstreamApiKey, upstreams: rawUpstreams, ...rest } = body as Record<string, unknown>;
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

    if (Array.isArray(rawUpstreams)) {
      const current = await getConfig();
      const currentMap = new Map((current.upstreams ?? []).map(c => [c.id, c]));
      const merged: UpstreamChannel[] = rawUpstreams.map((ch: Record<string, unknown>) => {
        const id = String(ch.id ?? '');
        const existing = currentMap.get(id);
        const newKey = typeof ch.apiKey === 'string' && ch.apiKey && !ch.apiKey.includes('••')
          ? ch.apiKey
          : (existing?.apiKey ?? '');
        return {
          id,
          name: String(ch.name ?? ''),
          baseUrl: String(ch.baseUrl ?? ''),
          apiKey: newKey,
          timeout: Number(ch.timeout ?? 60000),
          enabled: Boolean(ch.enabled ?? true),
          weight: Number(ch.weight ?? 1),
          type: (['openai', 'claude', 'auto'].includes(String(ch.type)) ? String(ch.type) : 'auto') as 'openai' | 'claude' | 'auto',
        };
      });
      updates.upstreams = merged;
    }

    await saveConfig(updates as Parameters<typeof saveConfig>[0]);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
