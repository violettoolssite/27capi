import type { Metadata } from 'next';
import Link from 'next/link';
import { getConfig } from '@/lib/config';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle, ArrowRight } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  return { title: `定价 — ${config.siteName}` };
}

const PLAN_FEATURES = [
  '所有模型完整访问权限',
  'OpenAI 兼容协议支持',
  '流式输出（SSE）',
  '独立 API Key 管理',
  '实时用量统计',
  '余额透明可查',
];

export default async function PricingPage() {
  const config = await getConfig();
  const cur = config.billing.currency || '¥';
  const perReq = config.billing.deductionPerRequest;
  const per1M_in = config.pricing.defaultInputPer1M;
  const per1M_out = config.pricing.defaultOutputPer1M;
  const note = config.pricing.note;
  const billingEnabled = config.billing.enabled;
  const defaultBalance = config.registration.defaultBalance;

  return (
    <div className="min-h-screen bg-clay-100">
      <Navbar siteName={config.siteName} logoUrl={config.logoUrl} />

      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="text-center mb-14">
          <h1 className="text-3xl font-bold text-clay-900 mb-3">定价说明</h1>
          <p className="text-clay-500 text-lg max-w-xl mx-auto">
            {billingEnabled ? '按使用量计费，注册即送余额，随用随充' : '当前服务对所有用户免费开放'}
          </p>
        </div>

        {billingEnabled ? (
          <div className="grid gap-6 sm:grid-cols-3 mb-12">
            <div className="card text-center py-8 col-span-full sm:col-span-1">
              <p className="text-xs text-clay-400 uppercase tracking-wide mb-1">注册赠送余额</p>
              <p className="text-4xl font-black text-terracotta-500">{cur}{defaultBalance.toFixed(2)}</p>
              <p className="text-sm text-clay-500 mt-1">新用户立即到账</p>
            </div>
            {perReq > 0 && (
              <div className="card text-center py-8">
                <p className="text-xs text-clay-400 uppercase tracking-wide mb-1">每次请求</p>
                <p className="text-4xl font-black text-clay-800">{cur}{perReq.toFixed(6)}</p>
                <p className="text-sm text-clay-500 mt-1">成功响应后扣除</p>
              </div>
            )}
            {per1M_in > 0 && (
              <div className="card text-center py-8">
                <p className="text-xs text-clay-400 uppercase tracking-wide mb-1">输入 / 100万 token</p>
                <p className="text-4xl font-black text-clay-800">{cur}{per1M_in.toFixed(4)}</p>
                <p className="text-sm text-clay-500 mt-1">输出 {cur}{per1M_out.toFixed(4)} / 1M</p>
              </div>
            )}
          </div>
        ) : (
          <div className="card text-center py-12 mb-12 border-terracotta-200 bg-terracotta-50">
            <p className="text-4xl font-black text-terracotta-500 mb-2">免费</p>
            <p className="text-clay-600">当前所有功能对注册用户完全免费</p>
          </div>
        )}

        {/* Plan features */}
        <div className="card mb-12">
          <h2 className="text-lg font-bold text-clay-900 mb-5">包含功能</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLAN_FEATURES.map(f => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-clay-700">
                <CheckCircle size={15} className="text-terracotta-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {note && (
          <div className="rounded-xl border border-clay-200 bg-clay-50 px-5 py-4 mb-8 text-sm text-clay-600">
            <p className="font-semibold text-clay-800 mb-1">计费说明</p>
            <p className="leading-relaxed">{note}</p>
          </div>
        )}

        <div className="text-center">
          <Link href="/login" className="btn-primary inline-flex">
            立即注册，开始使用 <ArrowRight size={15} />
          </Link>
          <p className="mt-3 text-sm text-clay-400">
            已有账号？<Link href="/login" className="text-terracotta-500 hover:underline">登录</Link>
          </p>
        </div>
      </div>

      <Footer siteName={config.siteName} config={{ contact: config.contact, legal: config.legal, siteDescription: config.siteDescription }} />
    </div>
  );
}
