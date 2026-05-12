import { type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { apiKeyDb } from '@/lib/db';
import { verifyToken, SESSION_COOKIE, generateApiKey, hashApiKey } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getUser(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const keys = apiKeyDb.listForUser(user.sub).map(k => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    status: k.status,
    usageCount: k.usageCount,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
    expiresAt: k.expiresAt,
  }));

  return Response.json(keys);
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { name?: string; expiresIn?: number };
  try { body = await request.json(); } catch { body = {}; }

  const name = (body.name || 'Default Key').slice(0, 64);
  const key = generateApiKey();
  const keyHash = hashApiKey(key);
  const keyPrefix = key.slice(0, 16) + '...';

  const expiresAt = body.expiresIn ? Date.now() + body.expiresIn * 1000 : null;

  const record = apiKeyDb.create({
    userId: user.sub,
    keyPrefix,
    keyHash,
    name,
    status: 'active',
    expiresAt,
  });

  return Response.json({
    id: record.id,
    name: record.name,
    key,
    keyPrefix,
    status: record.status,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  });
}
