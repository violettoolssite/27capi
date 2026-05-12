import Link from 'next/link';
import { Github, Mail, MessageCircle } from 'lucide-react';
import type { SiteConfig } from '@/lib/config';

interface Props {
  siteName: string;
  config?: Pick<SiteConfig, 'contact' | 'legal' | 'siteDescription'>;
}

export default function Footer({ siteName, config }: Props) {
  const year = new Date().getFullYear();
  const copyright = config?.legal?.copyright || `© ${year} ${siteName}`;
  const icp = config?.legal?.icp;
  const email = config?.contact?.email;
  const telegram = config?.contact?.telegram;

  return (
    <footer className="border-t border-clay-200 bg-clay-100 mt-20">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-3 mb-8">
          <div>
            <p className="font-bold text-clay-800 mb-2">{siteName}</p>
            <p className="text-sm text-clay-500 leading-relaxed">
              {config?.siteDescription || '高速稳定的 OpenAI 兼容 API 中转服务'}
            </p>
          </div>
          <div>
            <p className="font-semibold text-clay-700 text-sm mb-3">快速导航</p>
            <ul className="space-y-2 text-sm text-clay-500">
              <li><Link href="/" className="hover:text-clay-800 transition-colors">首页</Link></li>
              <li><Link href="/models" className="hover:text-clay-800 transition-colors">可用模型</Link></li>
              <li><Link href="/pricing" className="hover:text-clay-800 transition-colors">定价</Link></li>
              <li><Link href="/docs" className="hover:text-clay-800 transition-colors">API 文档</Link></li>
              <li><Link href="/status" className="hover:text-clay-800 transition-colors">服务状态</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-clay-700 text-sm mb-3">联系我们</p>
            <ul className="space-y-2 text-sm text-clay-500">
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-clay-800 transition-colors">
                    <Mail size={12} /> {email}
                  </a>
                </li>
              )}
              {telegram && (
                <li>
                  <a href={`https://t.me/${telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-clay-800 transition-colors">
                    <MessageCircle size={12} /> {telegram}
                  </a>
                </li>
              )}
              <li>
                <a href="https://github.com/violettoolssite/27capi" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-clay-800 transition-colors">
                  <Github size={12} /> violettoolssite/27capi
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-clay-200 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-clay-400">
          <span>{copyright}. Powered by 27c API</span>
          {icp && (
            <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer"
              className="hover:text-clay-600 transition-colors">
              {icp}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
