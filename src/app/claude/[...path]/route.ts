import { type NextRequest } from 'next/server';
import { getConfig, type SiteConfig } from '@/lib/config';
import { apiKeyDb, userDb, appendUsageLog } from '@/lib/db';
import { hashApiKey } from '@/lib/auth';
import { calculateCost } from '@/lib/model-prices';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Anthropic response headers to forward
const FORWARDED_RESP_HEADERS = [
  'content-type', 'x-request-id', 'request-id',
  'anthropic-ratelimit-requests-limit', 'anthropic-ratelimit-requests-remaining', 'anthropic-ratelimit-requests-reset',
  'anthropic-ratelimit-tokens-limit', 'anthropic-ratelimit-tokens-remaining', 'anthropic-ratelimit-tokens-reset',
  'retry-after',
];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, anthropic-version, anthropic-beta, X-Requested-With, Accept',
    'Access-Control-Max-Age': '86400',
  };
}

function pickUpstream(config: SiteConfig): { baseUrl: string; apiKey: string; timeout: number } | null {
  const channels = (config.upstreams ?? []).filter(c =>
    c.enabled && c.baseUrl && c.apiKey && (!c.type || c.type === 'claude' || c.type === 'auto')
  );
  if (channels.length > 0) {
    const totalWeight = channels.reduce((sum, c) => sum + (c.weight || 1), 0);
    let rand = Math.random() * totalWeight;
    for (const ch of channels) {
      rand -= (ch.weight || 1);
      if (rand <= 0) return { baseUrl: ch.baseUrl, apiKey: ch.apiKey, timeout: ch.timeout || 60000 };
    }
    return { baseUrl: channels[channels.length - 1].baseUrl, apiKey: channels[channels.length - 1].apiKey, timeout: channels[channels.length - 1].timeout || 60000 };
  }
  // Fallback: use legacy single upstream (assume compatible)
  if (config.upstream.baseUrl && config.upstream.apiKey) return config.upstream;
  return null;
}

interface UsageData {
  input_tokens?: number;
  output_tokens?: number;
}

function buildInterceptedStream(
  body: ReadableStream<Uint8Array>,
  onDone: (usage: UsageData | null) => void
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  let buf = '';
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const reader = body.getReader();
      function pump() {
        reader.read().then(({ done, value }) => {
          if (done) {
            let usage: UsageData | null = null;
            for (const line of buf.split('\n')) {
              if (line.startsWith('data: ')) {
                try {
                  const d = JSON.parse(line.slice(6));
                  if (d?.type === 'message_start' && d?.message?.usage) usage = d.message.usage;
                  if (d?.type === 'message_delta' && d?.usage) {
                    usage = { ...usage, output_tokens: d.usage.output_tokens };
                  }
                } catch {}
              }
            }
            controller.close();
            onDone(usage);
            return;
          }
          buf += decoder.decode(value, { stream: true });
          if (buf.length > 16384) buf = buf.slice(-8192);
          controller.enqueue(value);
          pump();
        }).catch(e => controller.error(e));
      }
      pump();
    },
  });
}

async function relay(request: NextRequest, paramsPromise: Promise<{ path: string[] }>) {
  const params = await paramsPromise;
  const config = await getConfig();

  const upstream = pickUpstream(config);
  if (!upstream) {
    return Response.json(
      { type: 'error', error: { type: 'api_error', message: '上游 API 未配置，请先在管理面板完成配置' } },
      { status: 503, headers: corsHeaders() }
    );
  }

  // Claude uses x-api-key header; also accept Authorization: Bearer for compatibility
  const xApiKey = request.headers.get('x-api-key') ?? '';
  const bearerKey = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  const clientKey = xApiKey || bearerKey;

  let userId: string | null = null;
  let apiKeyId: string | null = null;
  const pathStr = params.path.join('/');

  if (clientKey.startsWith('sk-27c-')) {
    const keyHash = hashApiKey(clientKey);
    const apiKey = apiKeyDb.findByHash(keyHash);
    if (!apiKey || apiKey.status !== 'active') {
      return Response.json({ type: 'error', error: { type: 'authentication_error', message: 'Invalid API key' } }, { status: 401, headers: corsHeaders() });
    }
    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      return Response.json({ type: 'error', error: { type: 'authentication_error', message: 'API key expired' } }, { status: 401, headers: corsHeaders() });
    }
    userId = apiKey.userId;
    apiKeyId = apiKey.id;
  } else if (config.access.requireRelayKey && clientKey !== config.access.relayKey) {
    return Response.json({ type: 'error', error: { type: 'authentication_error', message: 'Invalid relay key' } }, { status: 401, headers: corsHeaders() });
  }

  if (userId) {
    const user = userDb.findById(userId);
    if (!user || user.status !== 'active') {
      return Response.json({ type: 'error', error: { type: 'permission_error', message: '账号已被禁用' } }, { status: 403, headers: corsHeaders() });
    }
    if (config.billing.enabled && user.balance < config.billing.deductionPerRequest) {
      return Response.json({ type: 'error', error: { type: 'permission_error', message: '余额不足，请联系管理员充值' } }, { status: 402, headers: corsHeaders() });
    }
  }

  const upstreamBase = upstream.baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
  const upstreamUrl = `${upstreamBase}/v1/${pathStr}${new URL(request.url).search}`;

  const forwardHeaders: Record<string, string> = {
    'x-api-key': upstream.apiKey,
    'anthropic-version': request.headers.get('anthropic-version') || '2023-06-01',
  };
  const ct = request.headers.get('content-type');
  if (ct) forwardHeaders['Content-Type'] = ct;
  const beta = request.headers.get('anthropic-beta');
  if (beta) forwardHeaders['anthropic-beta'] = beta;

  const hasBody = !['GET', 'HEAD'].includes(request.method.toUpperCase());
  const body = hasBody ? await request.arrayBuffer().catch(() => undefined) : undefined;

  let requestedModel: string | null = null;
  if (body && ct?.includes('application/json')) {
    try {
      const parsed = JSON.parse(Buffer.from(body).toString('utf-8'));
      requestedModel = typeof parsed.model === 'string' ? parsed.model : null;
    } catch {}
  }

  let upstreamResp: Response;
  try {
    upstreamResp = await fetch(upstreamUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: hasBody && body ? body : undefined,
      // @ts-ignore
      duplex: 'half',
      signal: AbortSignal.timeout(upstream.timeout),
    });
  } catch (err: unknown) {
    return Response.json(
      { type: 'error', error: { type: 'api_error', message: `无法连接上游: ${err instanceof Error ? err.message : String(err)}` } },
      { status: 502, headers: corsHeaders() }
    );
  }

  const respHeaders = new Headers(corsHeaders());
  for (const h of FORWARDED_RESP_HEADERS) {
    const v = upstreamResp.headers.get(h);
    if (v) respHeaders.set(h, v);
  }

  const contentType = upstreamResp.headers.get('content-type') ?? '';
  const isSSE = contentType.includes('text/event-stream');
  const statusCode = upstreamResp.status;

  if (upstreamResp.body && userId && apiKeyId) {
    const _userId = userId;
    const _apiKeyId = apiKeyId;
    const _path = pathStr;
    const _model = requestedModel;
    const _billingEnabled = config.billing.enabled;
    const _fallback = config.billing.deductionPerRequest;

    if (isSSE) {
      const intercepted = buildInterceptedStream(upstreamResp.body, (usage) => {
        const promptTokens = usage?.input_tokens ?? 0;
        const completionTokens = usage?.output_tokens ?? 0;
        const cost = _billingEnabled
          ? calculateCost(_model, promptTokens, completionTokens, _fallback)
          : 0;
        userDb.deductBalance(_userId, cost);
        apiKeyDb.incrementUsage(_apiKeyId);
        appendUsageLog({ userId: _userId, apiKeyId: _apiKeyId, model: _model, promptTokens, completionTokens, totalTokens: promptTokens + completionTokens, cost, requestPath: _path, statusCode, createdAt: Date.now() });
      });
      return new Response(intercepted, { status: statusCode, statusText: upstreamResp.statusText, headers: respHeaders });
    } else {
      const text = await upstreamResp.text();
      try {
        const d = JSON.parse(text);
        const promptTokens = d?.usage?.input_tokens ?? 0;
        const completionTokens = d?.usage?.output_tokens ?? 0;
        const cost = _billingEnabled
          ? calculateCost(_model, promptTokens, completionTokens, _fallback)
          : 0;
        userDb.deductBalance(_userId, cost);
        apiKeyDb.incrementUsage(_apiKeyId);
        appendUsageLog({ userId: _userId, apiKeyId: _apiKeyId, model: _model, promptTokens, completionTokens, totalTokens: promptTokens + completionTokens, cost, requestPath: _path, statusCode, createdAt: Date.now() });
      } catch {}
      return new Response(text, { status: statusCode, statusText: upstreamResp.statusText, headers: respHeaders });
    }
  }

  return new Response(upstreamResp.body, { status: statusCode, statusText: upstreamResp.statusText, headers: respHeaders });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return relay(request, params);
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return relay(request, params);
}
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
