import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Zap, Shield, Globe, Layers, ArrowRight, Key, BarChart2, UserCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ModelGrid from '@/components/ModelGrid';
import { getConfig } from '@/lib/config';
import HeroCopy from '@/components/HeroCopy';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  return {
    title: config.siteName,
    description: config.siteDescription,
    keywords: config.siteKeyword,
    icons: config.faviconUrl ? [{ url: config.faviconUrl }] : undefined,
  };
}

const FEATURES = [
  { icon: Zap, title: '超低延迟', desc: '直连上游接口，最大限度降低转发延迟，全程毫秒级响应' },
  { icon: Shield, title: '安全可靠', desc: '密钥从不暴露，独立 API Key 体系保护每位用户' },
  { icon: Globe, title: '全模型支持', desc: '自动同步上游所有模型，无需手动维护模型列表' },
  { icon: Layers, title: '流式响应', desc: '完整支持 SSE 流式输出，实时返回每个 token' },
];

const HOW_IT_WORKS = [
  { icon: UserCircle, step: '01', title: '注册账号', desc: '免费注册，立即获得初始余额' },
  { icon: Key, step: '02', title: '创建 API Key', desc: '在仪表盘生成专属 Key，一键复制' },
  { icon: BarChart2, step: '03', title: '开始调用', desc: '替换 base_url，其余代码无需修改' },
];

export default async function HomePage() {
  const config = await getConfig();
  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${proto}://${host}/v1`;

  return (
    <div className="min-h-screen bg-clay-100">
      {config.announcement && (
        <div className="bg-terracotta-500 py-2.5 px-4 text-center text-sm text-white font-medium">
          {config.announcement}
        </div>
      )}

      <Navbar siteName={config.siteName} logoUrl={config.logoUrl} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(ellipse at 65% 0%, #F0C9B5 0%, transparent 55%), radial-gradient(ellipse at 5% 90%, #EDE8E0 0%, transparent 50%)',
        }} />
        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-28 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-clay-300 bg-clay-50 px-4 py-1.5 text-sm text-clay-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            OpenAI 兼容 · 一键接入
          </div>
          <h1 className="mb-5 text-5xl font-extrabold tracking-tight text-clay-900 sm:text-6xl lg:text-7xl">
            {config.siteName}
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-clay-500 leading-relaxed">
            {config.siteDescription}
          </p>

          {/* API endpoint display - no code */}
          <div className="mx-auto max-w-xl mb-4">
            <p className="text-xs text-clay-400 mb-2 font-medium uppercase tracking-wide">接入地址（Base URL）</p>
            <HeroCopy baseUrl={baseUrl} />
          </div>
          <p className="text-sm text-clay-400 mb-8">
            API Key 请在
            <Link href="/dashboard" className="text-terracotta-500 hover:underline mx-1 font-medium">用户仪表盘</Link>
            创建后使用
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-primary">
              免费注册 <ArrowRight size={15} />
            </Link>
            <Link href="/models" className="btn-secondary">查看全部模型</Link>
            <Link href="/docs" className="btn-ghost">API 文档</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta-100">
                <Icon size={18} className="text-terracotta-600" />
              </div>
              <p className="font-semibold text-clay-900">{title}</p>
              <p className="text-sm text-clay-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="text-center mb-10">
          <h2 className="section-title">三步开始使用</h2>
          <p className="section-sub">从注册到调用，5 分钟完成接入</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="card flex flex-col items-center text-center gap-3 py-8">
              <div className="text-3xl font-black text-clay-200">{step}</div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta-50">
                <Icon size={22} className="text-terracotta-500" />
              </div>
              <p className="font-bold text-clay-900">{title}</p>
              <p className="text-sm text-clay-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Model preview */}
      <ModelGrid />

      {/* API endpoint info */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-clay-200 bg-clay-50 p-8 text-center">
          <h2 className="text-xl font-bold text-clay-900 mb-2">立即开始接入</h2>
          <p className="text-clay-500 text-sm mb-6">将 base_url 替换为下方地址，保持其他代码不变</p>
          <div className="max-w-md mx-auto mb-6">
            <HeroCopy baseUrl={baseUrl} />
          </div>
          <div className="flex flex-wrap gap-3 justify-center text-sm text-clay-500">
            <span className="rounded-full bg-clay-200 px-3 py-1">认证方式：Bearer API Key</span>
            <span className="rounded-full bg-clay-200 px-3 py-1">协议：OpenAI v1</span>
            <span className="rounded-full bg-clay-200 px-3 py-1">支持流式输出</span>
          </div>
        </div>
      </section>

      <Footer siteName={config.siteName} config={{ contact: config.contact, legal: config.legal, siteDescription: config.siteDescription }} />
    </div>
  );
}
