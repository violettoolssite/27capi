import type { Metadata } from 'next';
import './globals.css';
import { getConfig } from '@/lib/config';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  return {
    title: {
      default: config.siteName,
      template: `%s — ${config.siteName}`,
    },
    description: config.siteDescription,
    keywords: config.siteKeyword,
    icons: {
      icon: config.faviconUrl ?? '/favicon.svg',
      shortcut: config.faviconUrl ?? '/favicon.svg',
      apple: config.faviconUrl ?? '/favicon.svg',
    },
    openGraph: {
      title: config.siteName,
      description: config.siteDescription,
      type: 'website',
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getConfig();
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
        {config.customCss && (
          <style dangerouslySetInnerHTML={{ __html: config.customCss }} />
        )}
      </body>
    </html>
  );
}
