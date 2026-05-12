import type { Metadata } from 'next';
import { getConfig } from '@/lib/config';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ModelGrid from '@/components/ModelGrid';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  return { title: `可用模型 — ${config.siteName}`, description: '查看所有可用的 AI 模型列表' };
}

export default async function ModelsPage() {
  const config = await getConfig();
  return (
    <div className="min-h-screen bg-clay-100">
      <Navbar siteName={config.siteName} logoUrl={config.logoUrl} />
      <div className="mx-auto max-w-6xl px-6 pt-14 pb-2">
        <h1 className="text-3xl font-bold text-clay-900">可用模型</h1>
        <p className="text-clay-500 mt-2 text-lg">
          实时从上游接口同步，所有模型均支持标准 OpenAI 兼容协议
        </p>
      </div>
      <ModelGrid />
      <Footer siteName={config.siteName} config={{ contact: config.contact, legal: config.legal, siteDescription: config.siteDescription }} />
    </div>
  );
}
