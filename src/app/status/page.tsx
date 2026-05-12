import type { Metadata } from 'next';
import { getConfig } from '@/lib/config';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  return { title: `服务状态 — ${config.siteName}` };
}

async function checkUpstream(baseUrl: string, apiKey: string): Promise<{
  ok: boolean; latency: number | null; message: string; code: number | null;
}> {
  if (!baseUrl || !apiKey) return { ok: false, latency: null, message: '未配置上游接口', code: null };
  const url = `${baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '')}/v1/models`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    const latency = Date.now() - start;
    return { ok: res.ok, latency, message: res.ok ? '正常' : `HTTP ${res.status}`, code: res.status };
  } catch (e: unknown) {
    return { ok: false, latency: Date.now() - start, message: e instanceof Error ? e.message : '连接失败', code: null };
  }
}

export default async function StatusPage() {
  const config = await getConfig();
  const check = await checkUpstream(config.upstream.baseUrl, config.upstream.apiKey);
  const now = new Date().toLocaleString('zh-CN');

  return (
    <div className="min-h-screen bg-clay-100">
      <Navbar siteName={config.siteName} logoUrl={config.logoUrl} />

      <div className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-bold text-clay-900 mb-2">服务状态</h1>
        <p className="text-clay-500 mb-10">实时检测中转接口可用性</p>

        {/* Overall status banner */}
        <div className={`rounded-2xl p-6 mb-8 flex items-center gap-4 ${
          check.ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
        }`}>
          {check.ok
            ? <CheckCircle size={32} className="text-emerald-500 shrink-0" />
            : <XCircle size={32} className="text-red-500 shrink-0" />}
          <div>
            <p className={`text-lg font-bold ${check.ok ? 'text-emerald-800' : 'text-red-800'}`}>
              {check.ok ? '所有服务正常运行' : '服务异常'}
            </p>
            <p className={`text-sm ${check.ok ? 'text-emerald-600' : 'text-red-600'}`}>
              上次检测：{now}
            </p>
          </div>
        </div>

        {/* Component status */}
        <div className="card">
          <h2 className="text-base font-bold text-clay-800 mb-4">组件状态</h2>
          <div className="divide-y divide-clay-100">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                {check.ok ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
                <div>
                  <p className="text-sm font-medium text-clay-800">上游 API 接口</p>
                  <p className="text-xs text-clay-400">{config.upstream.baseUrl || '未配置'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`badge ${check.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                  {check.message}
                </span>
                {check.latency !== null && (
                  <p className="text-xs text-clay-400 mt-1 flex items-center justify-end gap-1">
                    <Clock size={10} /> {check.latency}ms
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-clay-800">中转服务</p>
                  <p className="text-xs text-clay-400">请求转发、认证、计费</p>
                </div>
              </div>
              <span className="badge bg-emerald-50 text-emerald-600">正常</span>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-clay-800">用户系统</p>
                  <p className="text-xs text-clay-400">注册、登录、API Key 管理</p>
                </div>
              </div>
              <span className="badge bg-emerald-50 text-emerald-600">正常</span>
            </div>
          </div>
        </div>

        {!config.upstream.baseUrl && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>管理员尚未配置上游 API。请前往 <a href="/admin" className="font-medium underline">管理面板</a> 完成配置后服务才可用。</p>
          </div>
        )}
      </div>

      <Footer siteName={config.siteName} config={{ contact: config.contact, legal: config.legal, siteDescription: config.siteDescription }} />
    </div>
  );
}
