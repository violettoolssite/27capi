import { type NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getConfig, saveConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 2 * 1024 * 1024;

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const config = await getConfig();
  return token === config.adminPassword;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return Response.json({ error: '密码错误' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: '请求格式错误' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const type = (formData.get('type') as string) ?? 'logo';

  if (!file) return Response.json({ error: '未找到文件' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: '不支持的文件格式，请上传 PNG/JPG/GIF/WebP/SVG 图片' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: '文件大小不能超过 2MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const filename = `${type}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

  const url = `/uploads/${filename}`;

  if (type === 'logo') {
    await saveConfig({ logoUrl: url });
  } else if (type === 'favicon') {
    await saveConfig({ faviconUrl: url });
  }

  return Response.json({ ok: true, url });
}
