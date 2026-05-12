'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Settings, Github, LayoutDashboard, LogIn, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  siteName: string;
  logoUrl: string | null;
}

const NAV_LINKS = [
  { href: '/models',  label: '模型' },
  { href: '/pricing', label: '定价' },
  { href: '/docs',    label: '文档' },
  { href: '/status',  label: '状态' },
];

function DefaultLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="10" fill="#CF6B4A" />
      <path d="M8 16C8 11.582 11.582 8 16 8C20.418 8 24 11.582 24 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 24C16 24 10 20.5 10 16M16 24C16 24 22 20.5 22 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.5" fill="white" />
    </svg>
  );
}

export default function Navbar({ siteName, logoUrl }: Props) {
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setUsername(d.username))
      .catch(() => {});
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-clay-200 bg-clay-50/90 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-clay-900 hover:opacity-80 transition-opacity shrink-0">
          {logoUrl ? (
            <Image src={logoUrl} alt={siteName} width={32} height={32} className="rounded-lg object-contain" />
          ) : <DefaultLogo />}
          <span className="text-lg font-bold">{siteName}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`btn-ghost text-sm ${pathname === href ? 'text-terracotta-600 bg-terracotta-50' : ''}`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-1">
          {username ? (
            <Link href="/dashboard" className="btn-ghost text-sm flex items-center gap-1.5">
              <LayoutDashboard size={14} /> {username}
            </Link>
          ) : (
            <Link href="/login" className="btn-primary text-sm py-2 px-4">
              <LogIn size={13} /> 登录
            </Link>
          )}
          <a href="https://github.com/violettoolssite/27capi" target="_blank" rel="noopener noreferrer"
            className="btn-ghost p-2" title="GitHub 开源仓库">
            <Github size={16} />
          </a>
          <Link href="/admin" className="btn-ghost p-2" title="管理面板">
            <Settings size={15} />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMenuOpen(v => !v)} className="md:hidden btn-ghost p-2">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-clay-200 bg-clay-50 px-6 py-4 flex flex-col gap-1 animate-fade-in">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${pathname === href ? 'bg-terracotta-50 text-terracotta-600' : 'text-clay-600 hover:bg-clay-200'}`}>
              {label}
            </Link>
          ))}
          <hr className="border-clay-200 my-1" />
          {username ? (
            <Link href="/dashboard" className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-clay-600 hover:bg-clay-200">
              <LayoutDashboard size={14} /> {username} 的仪表盘
            </Link>
          ) : (
            <Link href="/login" className="btn-primary justify-center text-sm">
              <LogIn size={14} /> 登录 / 注册
            </Link>
          )}
          <Link href="/admin" className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-clay-500 hover:bg-clay-200">
            <Settings size={14} /> 管理面板
          </Link>
        </div>
      )}
    </header>
  );
}
