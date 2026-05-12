'use client';

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Palette, Phone, FileText, Megaphone, Lock, Save,
  Upload, CheckCircle, AlertCircle, Home, ImageIcon,
  DollarSign, RotateCcw, Mail, Send, Plus, X,
} from 'lucide-react';

type Tab = 'brand' | 'contact' | 'announcement' | 'legal' | 'pricing' | 'email';

interface ZConfig {
  siteName: string;
  siteDescription: string;
  siteKeyword: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  announcement: string;
  contact: { email: string; wechat: string; telegram: string; qq: string };
  legal: { icp: string; copyright: string };
  pricing: { showPage: boolean; defaultInputPer1M: number; defaultOutputPer1M: number; note: string };
  registration: { enabled: boolean; defaultBalance: number };
  smtp: { host: string; port: number; user: string; pass: string; fromName: string; fromEmail: string };
  emailVerification: { enabled: boolean; whitelist: string[] };
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium shadow-lg animate-slide-up ${ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
      {ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {msg}
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: typeof Palette }[] = [
  { id: 'brand',        label: '品牌外观', icon: Palette },
  { id: 'contact',      label: '联系方式', icon: Phone },
  { id: 'announcement', label: '公告栏',   icon: Megaphone },
  { id: 'legal',        label: '备案信息', icon: FileText },
  { id: 'pricing',      label: '定价配置', icon: DollarSign },
  { id: 'email',        label: '邮件服务', icon: Mail },
];

export default function ZidinyiPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState('');
  const [authErr, setAuthErr] = useState('');
  const [tab, setTab] = useState<Tab>('brand');
  const [cfg, setCfg] = useState<ZConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  function notify(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadConfig() {
    const res = await fetch('/api/admin/config');
    if (res.ok) {
      const d = await res.json();
      setCfg({
        siteName: d.siteName,
        siteDescription: d.siteDescription,
        siteKeyword: d.siteKeyword,
        logoUrl: d.logoUrl,
        faviconUrl: d.faviconUrl,
        announcement: d.announcement,
        contact: d.contact,
        legal: d.legal,
        pricing: d.pricing,
        registration: d.registration,
        smtp: d.smtp,
        emailVerification: d.emailVerification,
      });
    }
  }

  async function login(p: string) {
    await loadConfig();
    sessionStorage.setItem('zdy_p', p);
    setAuthed(true);
  }

  useEffect(() => {
    const sp = sessionStorage.getItem('zdy_p');
    if (sp) { setPwd(sp); login(sp); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendTestEmail() {
    setTestEmailLoading(true);
    setTestEmailResult(null);
    const res = await fetch('/api/admin/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pwd}` },
      body: JSON.stringify({ to: testEmailTo }),
    });
    const d = await res.json();
    setTestEmailResult({ ok: res.ok, msg: d.error || d.message || (res.ok ? '发送成功' : '发送失败') });
    setTestEmailLoading(false);
  }

  async function save() {
    if (!cfg) return;
    setSaving(true);
    const p = sessionStorage.getItem('zdy_p') ?? pwd;
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p}` },
      body: JSON.stringify(cfg),
    });
    setSaving(false);
    if (res.ok) notify('配置已保存，刷新页面生效');
    else notify((await res.json()).error || '保存失败', false);
  }

  async function upload(e: ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const p = sessionStorage.getItem('zdy_p') ?? pwd;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    const res = await fetch('/api/admin/upload', { method: 'POST', headers: { Authorization: `Bearer ${p}` }, body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      setCfg(c => c && { ...c, [type === 'logo' ? 'logoUrl' : 'faviconUrl']: data.url });
      notify(`${type === 'logo' ? 'Logo' : 'Favicon'} 上传成功`);
    } else notify(data.error || '上传失败', false);
    e.target.value = '';
  }

  function upd<K extends keyof ZConfig>(key: K, val: ZConfig[K]) {
    setCfg(c => c && { ...c, [key]: val });
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-clay-100 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta-500 shadow-lg">
              <Palette size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-clay-900">站点定制</h1>
            <p className="mt-1 text-clay-500 text-sm">输入管理员密码，自定义中转站商业信息</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); login(pwd); }} className="card flex flex-col gap-4">
            <div>
              <label className="label">管理员密码</label>
              <input type="password" className="input" placeholder="输入密码" value={pwd} onChange={e => setPwd(e.target.value)} autoFocus />
            </div>
            {authErr && <p className="flex items-center gap-1.5 text-sm text-red-600"><AlertCircle size={13} /> {authErr}</p>}
            <button type="submit" disabled={!pwd} className="btn-primary justify-center">进入定制面板</button>
          </form>
          <p className="text-center text-sm text-clay-400 mt-4">
            <Link href="/" className="hover:text-clay-700">← 返回首页</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!cfg) return null;

  return (
    <div className="min-h-screen bg-clay-100">
      <header className="sticky top-0 z-50 border-b border-clay-200 bg-clay-50/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-terracotta-500" />
            <span className="text-lg font-bold text-clay-900">站点定制</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost flex items-center gap-1.5 text-sm"><Home size={14} /> 返回首页</Link>
            <button onClick={save} disabled={saving} className="btn-primary">
              <Save size={14} /> {saving ? '保存中…' : '保存所有'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl gap-6 px-6 py-8">
        <aside className="w-40 shrink-0">
          <nav className="flex flex-col gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-all ${tab === id ? 'bg-terracotta-100 text-terracotta-700' : 'text-clay-600 hover:bg-clay-200'}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          {tab === 'brand' && (
            <div className="card flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-clay-900">品牌外观</h2>
                <p className="text-sm text-clay-500 mt-0.5">设置站点名称、描述及视觉资产</p>
              </div>
              <hr className="border-clay-200" />
              <div className="grid gap-5">
                <div>
                  <label className="label">站点名称</label>
                  <input className="input" value={cfg.siteName} onChange={e => upd('siteName', e.target.value)} placeholder="27c API" />
                </div>
                <div>
                  <label className="label">站点简介（首页副标题）</label>
                  <input className="input" value={cfg.siteDescription} onChange={e => upd('siteDescription', e.target.value)} placeholder="高速稳定的 OpenAI 兼容 API 中转服务" />
                </div>
                <div>
                  <label className="label">SEO 关键词</label>
                  <input className="input" value={cfg.siteKeyword} onChange={e => upd('siteKeyword', e.target.value)} placeholder="API中转, OpenAI, Claude" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Logo */}
                  <div>
                    <label className="label">Logo 图片</label>
                    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-clay-300 bg-clay-100 p-5 hover:border-clay-400 transition-colors">
                      {cfg.logoUrl
                        ? <Image src={cfg.logoUrl} alt="logo" width={64} height={64} className="rounded-lg object-contain" />
                        : <ImageIcon size={32} className="text-clay-300" />}
                      <button onClick={() => logoRef.current?.click()} disabled={uploading} className="btn-secondary text-xs py-1.5 px-3">
                        <Upload size={12} /> {uploading ? '上传中…' : '选择图片'}
                      </button>
                      <p className="text-xs text-clay-400 text-center">PNG/JPG/SVG，最大 2MB</p>
                      {cfg.logoUrl && (
                        <button onClick={() => upd('logoUrl', null)} className="text-xs text-clay-400 hover:text-red-500 flex items-center gap-1">
                          <RotateCcw size={10} /> 移除
                        </button>
                      )}
                    </div>
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => upload(e, 'logo')} />
                  </div>
                  {/* Favicon */}
                  <div>
                    <label className="label">浏览器图标（Favicon）</label>
                    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-clay-300 bg-clay-100 p-5 hover:border-clay-400 transition-colors">
                      {cfg.faviconUrl
                        ? <Image src={cfg.faviconUrl} alt="favicon" width={32} height={32} className="rounded object-contain" />
                        : <ImageIcon size={32} className="text-clay-300" />}
                      <button onClick={() => faviconRef.current?.click()} disabled={uploading} className="btn-secondary text-xs py-1.5 px-3">
                        <Upload size={12} /> {uploading ? '上传中…' : '选择图标'}
                      </button>
                      <p className="text-xs text-clay-400 text-center">推荐 32×32 PNG/ICO</p>
                      {cfg.faviconUrl && (
                        <button onClick={() => upd('faviconUrl', null)} className="text-xs text-clay-400 hover:text-red-500 flex items-center gap-1">
                          <RotateCcw size={10} /> 移除
                        </button>
                      )}
                    </div>
                    <input ref={faviconRef} type="file" accept="image/*" className="hidden" onChange={e => upload(e, 'favicon')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'contact' && (
            <div className="card flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-clay-900">联系方式</h2>
                <p className="text-sm text-clay-500 mt-0.5">显示在页脚，方便用户联系</p>
              </div>
              <hr className="border-clay-200" />
              <div className="grid gap-4">
                {(['email', 'wechat', 'telegram', 'qq'] as const).map(k => (
                  <div key={k}>
                    <label className="label capitalize">{k === 'email' ? '邮箱' : k === 'wechat' ? '微信号' : k === 'telegram' ? 'Telegram' : 'QQ'}</label>
                    <input className="input" value={cfg.contact[k]} onChange={e => upd('contact', { ...cfg.contact, [k]: e.target.value })}
                      placeholder={k === 'email' ? 'admin@example.com' : k === 'wechat' ? 'your_wechat_id' : k === 'telegram' ? '@username' : '123456789'} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'announcement' && (
            <div className="card flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-clay-900">公告栏</h2>
                <p className="text-sm text-clay-500 mt-0.5">显示在所有页面顶部（留空不显示）</p>
              </div>
              <hr className="border-clay-200" />
              <div>
                <label className="label">公告内容</label>
                <textarea className="input min-h-[100px] resize-y" value={cfg.announcement}
                  onChange={e => upd('announcement', e.target.value)}
                  placeholder="例：服务维护中，预计 XX 恢复。欢迎加入 Telegram 群获取最新消息…" />
              </div>
              <div className={`rounded-xl border px-4 py-3 text-sm ${cfg.announcement ? 'border-terracotta-200 bg-terracotta-500 text-white' : 'border-clay-200 bg-clay-100 text-clay-400'}`}>
                {cfg.announcement || '预览：公告栏（留空则不显示）'}
              </div>
            </div>
          )}

          {tab === 'legal' && (
            <div className="card flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-clay-900">备案 &amp; 版权信息</h2>
                <p className="text-sm text-clay-500 mt-0.5">显示在页脚底部</p>
              </div>
              <hr className="border-clay-200" />
              <div className="grid gap-4">
                <div>
                  <label className="label">ICP 备案号</label>
                  <input className="input" value={cfg.legal.icp} onChange={e => upd('legal', { ...cfg.legal, icp: e.target.value })}
                    placeholder="粤ICP备XXXXXXXX号" />
                  <p className="text-xs text-clay-400 mt-1.5">点击后自动链接至工信部备案查询页面</p>
                </div>
                <div>
                  <label className="label">版权声明</label>
                  <input className="input" value={cfg.legal.copyright} onChange={e => upd('legal', { ...cfg.legal, copyright: e.target.value })}
                    placeholder={`© ${new Date().getFullYear()} ${cfg.siteName}. All rights reserved.`} />
                  <p className="text-xs text-clay-400 mt-1.5">留空则自动生成 © 年份 站点名</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'pricing' && (
            <div className="card flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-clay-900">定价配置</h2>
                <p className="text-sm text-clay-500 mt-0.5">控制定价页面展示内容</p>
              </div>
              <hr className="border-clay-200" />
              <div className="grid gap-4">
                <div className="flex items-center justify-between rounded-xl border border-clay-200 bg-clay-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-clay-800">显示定价页面</p>
                    <p className="text-xs text-clay-500 mt-0.5">关闭后 /pricing 页面将隐藏</p>
                  </div>
                  <button onClick={() => upd('pricing', { ...cfg.pricing, showPage: !cfg.pricing.showPage })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${cfg.pricing.showPage ? 'bg-terracotta-500' : 'bg-clay-300'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${cfg.pricing.showPage ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">输入价格（每百万 token）</label>
                    <input className="input" type="number" step="0.0001" min="0" value={cfg.pricing.defaultInputPer1M}
                      onChange={e => upd('pricing', { ...cfg.pricing, defaultInputPer1M: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="label">输出价格（每百万 token）</label>
                    <input className="input" type="number" step="0.0001" min="0" value={cfg.pricing.defaultOutputPer1M}
                      onChange={e => upd('pricing', { ...cfg.pricing, defaultOutputPer1M: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div>
                  <label className="label">新用户初始余额</label>
                  <input className="input" type="number" step="0.01" min="0" value={cfg.registration.defaultBalance}
                    onChange={e => upd('registration', { ...cfg.registration, defaultBalance: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="label">计费补充说明</label>
                  <textarea className="input min-h-[80px] resize-y" value={cfg.pricing.note}
                    onChange={e => upd('pricing', { ...cfg.pricing, note: e.target.value })}
                    placeholder="说明余额有效期、充值方式、退款政策等" />
                </div>
              </div>
            </div>
          )}

          {tab === 'email' && (
            <div className="card flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-clay-900">邮件服务配置</h2>
                <p className="text-sm text-clay-500 mt-0.5">SMTP 发信设置 + 邮箱验证功能</p>
              </div>
              <hr className="border-clay-200" />
              <div className="grid gap-5">
                <div>
                  <label className="label">SMTP 主机</label>
                  <input className="input" value={cfg.smtp.host} onChange={e => upd('smtp', { ...cfg.smtp, host: e.target.value })}
                    placeholder="smtp.gmail.com / smtp.qq.com / smtp.resend.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">端口</label>
                    <input className="input" type="number" value={cfg.smtp.port} onChange={e => upd('smtp', { ...cfg.smtp, port: parseInt(e.target.value) || 587 })}
                      placeholder="587 (TLS) / 465 (SSL)" />
                  </div>
                  <div>
                    <label className="label">发件人名称</label>
                    <input className="input" value={cfg.smtp.fromName} onChange={e => upd('smtp', { ...cfg.smtp, fromName: e.target.value })}
                      placeholder="27c API" />
                  </div>
                </div>
                <div>
                  <label className="label">SMTP 用户名 / 邮箱</label>
                  <input className="input" value={cfg.smtp.user} onChange={e => upd('smtp', { ...cfg.smtp, user: e.target.value })}
                    placeholder="noreply@example.com" />
                </div>
                <div>
                  <label className="label">SMTP 密码 / 专用密码</label>
                  <input className="input" type="password" value={cfg.smtp.pass} onChange={e => upd('smtp', { ...cfg.smtp, pass: e.target.value })}
                    placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">发件人邮箱（可选，默认使用用户名）</label>
                  <input className="input" value={cfg.smtp.fromEmail} onChange={e => upd('smtp', { ...cfg.smtp, fromEmail: e.target.value })}
                    placeholder="noreply@example.com" />
                </div>
              </div>
              <hr className="border-clay-200" />
              <div className="flex items-center justify-between p-4 rounded-xl border border-clay-200 bg-clay-50">
                <div>
                  <h3 className="font-medium text-clay-900">邮箱验证</h3>
                  <p className="text-xs text-clay-500 mt-0.5">注册时发送验证邮件，防止恶意批量注册</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={cfg.emailVerification.enabled}
                    onChange={e => upd('emailVerification', { ...cfg.emailVerification, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-clay-300 text-terracotta-500 focus:ring-terracotta-500" />
                  <span className="text-sm text-clay-700">启用验证</span>
                </label>
              </div>
              {cfg.emailVerification.enabled && (
                <div>
                  <label className="label">邮箱域名白名单（每行一个域名，留空则允许所有）</label>
                  <textarea className="input min-h-[100px] font-mono text-xs" value={cfg.emailVerification.whitelist.join('\n')}
                    onChange={e => upd('emailVerification', { ...cfg.emailVerification, whitelist: e.target.value.split('\n').map(d => d.trim()).filter(Boolean) })}
                    placeholder="gmail.com&#10;qq.com&#10;163.com" />
                  <p className="text-xs text-clay-400 mt-1.5">仅允许指定后缀的邮箱注册，有效防止批量垃圾账号</p>
                </div>
              )}
              <hr className="border-clay-200" />
              <div className="rounded-xl border border-clay-200 bg-white p-5">
                <h3 className="font-medium text-clay-900 mb-3">测试邮件</h3>
                <div className="flex gap-3">
                  <input className="input flex-1" placeholder="收件邮箱地址" value={testEmailTo}
                    onChange={e => setTestEmailTo(e.target.value)} />
                  <button onClick={sendTestEmail} disabled={testEmailLoading || !cfg.smtp.host} className="btn-secondary">
                    {testEmailLoading ? '发送中…' : <><Send size={13} /> 发送</>}
                  </button>
                </div>
                {testEmailResult && (
                  <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${testEmailResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {testEmailResult.msg}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
