import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { getConfig } from '@/lib/config';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  return { title: `API 文档 — ${config.siteName}` };
}

const ENDPOINTS = [
  { method: 'POST', path: '/v1/chat/completions', desc: '对话补全（支持流式）', note: '主要接口，兼容所有支持 OpenAI 的客户端' },
  { method: 'GET',  path: '/v1/models',            desc: '获取可用模型列表',     note: '返回上游所有模型' },
  { method: 'POST', path: '/v1/completions',       desc: '文本补全（legacy）',   note: '兼容旧版 completions API' },
  { method: 'POST', path: '/v1/embeddings',        desc: '文本向量化',           note: '返回 embedding 向量' },
  { method: 'POST', path: '/v1/images/generations',desc: '图像生成',             note: '调用上游图像生成模型' },
];

const ERRORS = [
  { code: '401', title: 'Unauthorized',          desc: 'API Key 无效或未携带' },
  { code: '402', title: 'Payment Required',      desc: '账户余额不足' },
  { code: '403', title: 'Forbidden',             desc: '账号已被禁用' },
  { code: '429', title: 'Too Many Requests',     desc: '请求频率超限' },
  { code: '502', title: 'Bad Gateway',           desc: '无法连接上游 API' },
  { code: '503', title: 'Service Unavailable',   desc: '上游 API 未配置' },
];

export default async function DocsPage() {
  const config = await getConfig();
  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${proto}://${host}/v1`;

  return (
    <div className="min-h-screen bg-clay-100">
      <Navbar siteName={config.siteName} logoUrl={config.logoUrl} />

      <div className="mx-auto max-w-4xl px-6 py-14">
        <h1 className="text-3xl font-bold text-clay-900 mb-2">API 文档</h1>
        <p className="text-clay-500 text-lg mb-12">完全兼容 OpenAI API v1，无缝替换接入</p>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-clay-900 mb-4">认证方式</h2>
          <div className="card">
            <p className="text-sm text-clay-600 mb-4">所有请求均需在 Header 中携带 API Key：</p>
            <div className="rounded-xl bg-clay-200 px-4 py-3 font-mono text-sm text-clay-700 mb-4">
              Authorization: Bearer YOUR_API_KEY
            </div>
            <p className="text-sm text-clay-500">
              在
              <Link href="/dashboard" className="text-terracotta-500 hover:underline mx-1">用户仪表盘</Link>
              创建并管理您的 API Key。
            </p>
          </div>
        </section>

        {/* Base URL */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-clay-900 mb-4">接入地址</h2>
          <div className="card">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-clay-400 uppercase tracking-wide mb-1 font-medium">Base URL</p>
                <code className="text-terracotta-600 font-mono text-base font-bold">{baseUrl}</code>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="badge bg-emerald-50 text-emerald-700">HTTPS</span>
                <span className="badge bg-clay-200 text-clay-600">OpenAI v1 兼容</span>
                <span className="badge bg-blue-50 text-blue-600">SSE 流式</span>
              </div>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-clay-900 mb-4">支持的接口</h2>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-clay-200 bg-clay-100 text-clay-500 text-xs text-left">
                  <th className="px-5 py-3 font-medium w-16">方法</th>
                  <th className="px-5 py-3 font-medium">路径</th>
                  <th className="px-5 py-3 font-medium">说明</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clay-100">
                {ENDPOINTS.map(ep => (
                  <tr key={ep.path} className="hover:bg-clay-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`badge text-xs font-bold ${ep.method === 'POST' ? 'bg-terracotta-50 text-terracotta-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-clay-700 text-xs">{ep.path}</td>
                    <td className="px-5 py-3.5 text-clay-700">{ep.desc}</td>
                    <td className="px-5 py-3.5 text-clay-400 text-xs hidden sm:table-cell">{ep.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Error codes */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-clay-900 mb-4">错误码说明</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ERRORS.map(err => (
              <div key={err.code} className="card flex items-start gap-3 py-4">
                <span className="shrink-0 rounded-lg bg-red-50 px-2 py-1 font-mono text-xs font-bold text-red-500">{err.code}</span>
                <div>
                  <p className="text-sm font-semibold text-clay-800">{err.title}</p>
                  <p className="text-xs text-clay-500 mt-0.5">{err.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compatible clients */}
        <section>
          <h2 className="text-xl font-bold text-clay-900 mb-4">兼容客户端</h2>
          <div className="card">
            <p className="text-sm text-clay-600 mb-3">将以下客户端/SDK 的 base_url 替换为本站地址即可：</p>
            <div className="flex flex-wrap gap-2">
              {['OpenAI Python SDK', 'OpenAI Node.js SDK', 'LangChain', 'LlamaIndex', 'Cursor', 'ChatBox', 'Cherry Studio', 'LobeChat', 'NextChat', 'ChatGPT-Next-Web'].map(c => (
                <span key={c} className="badge bg-clay-200 text-clay-600">{c}</span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer siteName={config.siteName} config={{ contact: config.contact, legal: config.legal, siteDescription: config.siteDescription }} />
    </div>
  );
}
