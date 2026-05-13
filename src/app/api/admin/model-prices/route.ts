import { type NextRequest } from 'next/server';
import { getAllModelPrices, setModelPrice, deleteModelPrice } from '@/lib/model-prices';
import { OFFICIAL_PRICES, getOfficialPrice } from '@/lib/model-official-prices';
import { getConfig } from '@/lib/config';

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
  return Response.json({ prices: getAllModelPrices(), official: OFFICIAL_PRICES });
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) return Response.json({ error: '密码错误' }, { status: 401 });
  let body: { modelId: string; inputPer1M?: number; outputPer1M?: number; perRequest?: number; enabled?: boolean; markup?: number };
  try { body = await request.json(); } catch { return Response.json({ error: '格式错误' }, { status: 400 }); }
  if (!body.modelId) return Response.json({ error: '缺少 modelId' }, { status: 400 });
  const official = getOfficialPrice(body.modelId);
  const markup = body.markup ?? undefined;
  setModelPrice(body.modelId, {
    inputPer1M: markup && official ? official.input * markup : (body.inputPer1M ?? 0),
    outputPer1M: markup && official ? official.output * markup : (body.outputPer1M ?? 0),
    perRequest: body.perRequest ?? 0,
    enabled: body.enabled ?? true,
    markup,
  });
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) return Response.json({ error: '密码错误' }, { status: 401 });
  const url = new URL(request.url);
  const modelId = url.searchParams.get('modelId');
  if (!modelId) return Response.json({ error: '缺少 modelId' }, { status: 400 });
  deleteModelPrice(modelId);
  return Response.json({ ok: true });
}
