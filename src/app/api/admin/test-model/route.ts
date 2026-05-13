import { type NextRequest } from 'next/server';
import { getConfig, type SiteConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const config = await getConfig();
  return token === config.adminPassword;
}

function pickUpstream(config: SiteConfig, type: 'openai' | 'claude' = 'openai'): { baseUrl: string; apiKey: string; timeout: number } | null {
  const channels = (config.upstreams ?? []).filter(c =>
    c.enabled && c.baseUrl && c.apiKey && (!c.type || c.type === type || c.type === 'auto')
  );
  if (channels.length > 0) {
    const totalWeight = channels.reduce((sum, c) => sum + (c.weight || 1), 0);
    let rand = Math.random() * totalWeight;
    for (const ch of channels) {
      rand -= (ch.weight || 1);
      if (rand <= 0) return { baseUrl: ch.baseUrl, apiKey: ch.apiKey, timeout: ch.timeout || 60000 };
    }
    return { baseUrl: channels[0].baseUrl, apiKey: channels[0].apiKey, timeout: channels[0].timeout || 60000 };
  }
  if (config.upstream.baseUrl && config.upstream.apiKey) return config.upstream;
  return null;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) return Response.json({ error: '密码错误' }, { status: 401 });
  let body: { modelId: string };
  try { body = await request.json(); } catch { return Response.json({ error: '格式错误' }, { status: 400 }); }
  if (!body.modelId) return Response.json({ error: '缺少 modelId' }, { status: 400 });

  const config = await getConfig();
  const upstream = pickUpstream(config);
  if (!upstream) return Response.json({ ok: false, error: '上游未配置' });

  const base = upstream.baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
  const url = `${base}/v1/chat/completions`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstream.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: body.modelId,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const latency = Date.now() - start;
    if (res.ok) return Response.json({ ok: true, latency });
    let errMsg = `HTTP ${res.status}`;
    try {
      const d = await res.json();
      errMsg = d?.error?.message ?? d?.message ?? errMsg;
    } catch {}
    return Response.json({ ok: false, latency, error: errMsg });
  } catch (e: unknown) {
    const latency = Date.now() - start;
    return Response.json({ ok: false, latency, error: e instanceof Error ? e.message : String(e) });
  }
}
