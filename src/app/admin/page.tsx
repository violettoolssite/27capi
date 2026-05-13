'use client';

import { useState, useEffect, useRef, type ElementType, type ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Settings, Server, Palette, Lock, Home, Save, Eye, EyeOff,
  Upload, AlertCircle, CheckCircle, RotateCcw, ExternalLink,
  Users, Plus, Trash2, RefreshCw, ToggleLeft, ToggleRight, DollarSign, Mail,
} from 'lucide-react';

type Tab = 'site' | 'upstream' | 'branding' | 'access' | 'users' | 'pricing' | 'email';

interface UpstreamChannelForm {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  timeout: number;
  enabled: boolean;
  weight: number;
}

interface ConfigState {
  siteName: string;
  siteDescription: string;
  siteKeyword: string;
  announcement: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  upstream: { baseUrl: string; apiKeyMasked: string; timeout: number; configured: boolean };
  upstreams: UpstreamChannelForm[];
  access: { requireRelayKey: boolean; relayKey: string };
  billing: { enabled: boolean; deductionPerRequest: number; currency: string };
  registration: { enabled: boolean; defaultBalance: number };
  customCss: string;
  smtp: { host: string; port: number; user: string; pass: string; fromName: string; fromEmail: string };
  emailVerification: { enabled: boolean; whitelist: string[] };
}

interface AdminUser {
  id: string; username: string; email: string | null;
  role: 'admin' | 'user'; balance: number; status: 'active' | 'suspended';
  keyCount: number; createdAt: number;
}

interface FormState extends Omit<ConfigState, 'upstream'> {
  upstreamBaseUrl: string;
  upstreamApiKey: string;
  upstreamTimeout: number;
  newAdminPassword: string;
  confirmAdminPassword: string;
}

interface CreateUserForm {
  username: string; email: string; password: string;
  role: 'admin' | 'user'; balance: string;
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-medium shadow-lg animate-slide-up ${
        ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
      }`}
    >
      {ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: ElementType }[] = [
  { id: 'site', label: '站点设置', icon: Settings },
  { id: 'upstream', label: '上游渠道', icon: Server },
  { id: 'branding', label: '品牌定制', icon: Palette },
  { id: 'access', label: '访问控制', icon: Lock },
  { id: 'email', label: '邮件服务', icon: Mail },
  { id: 'users', label: '用户管理', icon: Users },
  { id: 'pricing', label: '模型定价', icon: DollarSign },
];

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<Tab>('site');
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({ username: '', email: '', password: '', role: 'user', balance: '0' });
  const [editBalance, setEditBalance] = useState<{ id: string; value: string } | null>(null);

  const [editingUpstream, setEditingUpstream] = useState<UpstreamChannelForm | null>(null);
  const [showAddUpstream, setShowAddUpstream] = useState(false);

  const [modelList, setModelList] = useState<string[]>([]);
  const [modelPrices, setModelPrices] = useState<Record<string, { inputPer1M: number; outputPer1M: number; perRequest: number; enabled: boolean; markup?: number }>>({});
  const [officialPrices, setOfficialPrices] = useState<Record<string, { input: number; output: number; note?: string }>>({});
  const [editingPrice, setEditingPrice] = useState<{ modelId: string; markup: string; inputPer1M: string; outputPer1M: string; perRequest: string; enabled: boolean } | null>(null);
  const [globalMarkup, setGlobalMarkup] = useState('');
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; latency?: number; error?: string; loading?: boolean }>>({});
  const [modelsLoading, setModelsLoading] = useState(false);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function login(pwd: string) {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/config', {
        headers: { Authorization: `Bearer ${pwd}` },
      });
      if (!res.ok) {
        setAuthError('密码错误，请重试');
        return;
      }
      const data: ConfigState = await res.json();
      setForm({
        siteName: data.siteName,
        siteDescription: data.siteDescription,
        siteKeyword: data.siteKeyword,
        announcement: data.announcement,
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        upstreamBaseUrl: data.upstream.baseUrl,
        upstreamApiKey: '',
        upstreamTimeout: data.upstream.timeout,
        upstreams: (data.upstreams ?? []).map(ch => ({ ...ch, apiKey: '' })),
        access: data.access,
        billing: data.billing ?? { enabled: false, deductionPerRequest: 0.001, currency: '¥' },
        registration: data.registration ?? { enabled: true, defaultBalance: 1.0 },
        customCss: data.customCss,
        smtp: data.smtp ?? { host: '', port: 587, user: '', pass: '', fromName: '', fromEmail: '' },
        emailVerification: data.emailVerification ?? { enabled: false, whitelist: [] },
        newAdminPassword: '',
        confirmAdminPassword: '',
      });
      sessionStorage.setItem('27c_admin_pwd', pwd);
      setAuthed(true);
    } catch {
      setAuthError('网络错误，请检查连接');
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    const stored = sessionStorage.getItem('27c_admin_pwd');
    if (stored) login(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!form) return;
    if (form.newAdminPassword && form.newAdminPassword !== form.confirmAdminPassword) {
      showToast('两次输入的新密码不一致', false);
      return;
    }
    setSaving(true);
    try {
      const pwd = sessionStorage.getItem('27c_admin_pwd') ?? password;
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pwd}`,
        },
        body: JSON.stringify({
          siteName: form.siteName,
          siteDescription: form.siteDescription,
          siteKeyword: form.siteKeyword,
          announcement: form.announcement,
          customCss: form.customCss,
          upstream: { baseUrl: form.upstreamBaseUrl, timeout: form.upstreamTimeout },
          upstreamApiKey: form.upstreamApiKey,
          upstreams: form.upstreams,
          access: form.access,
          billing: form.billing,
          registration: form.registration,
          smtp: form.smtp,
          emailVerification: form.emailVerification,
          ...(form.newAdminPassword ? { newAdminPassword: form.newAdminPassword } : {}),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Unknown error');
      if (form.newAdminPassword) {
        sessionStorage.setItem('27c_admin_pwd', form.newAdminPassword);
      }
      setForm((f) => f && { ...f, newAdminPassword: '', confirmAdminPassword: '', upstreamApiKey: '' });
      showToast('配置已保存');
    } catch (e: unknown) {
      showToast(`保存失败: ${e instanceof Error ? e.message : String(e)}`, false);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const pwd = sessionStorage.getItem('27c_admin_pwd') ?? password;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${pwd}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => f && { ...f, [type === 'logo' ? 'logoUrl' : 'faviconUrl']: data.url });
      showToast(`${type === 'logo' ? 'Logo' : 'Favicon'} 上传成功`);
    } catch (e: unknown) {
      showToast(`上传失败: ${e instanceof Error ? e.message : String(e)}`, false);
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  }

  function updateForm(key: keyof FormState, value: unknown) {
    setForm((f) => f && { ...f, [key]: value });
  }

  async function loadUsers() {
    setUsersLoading(true);
    const pwd = sessionStorage.getItem('27c_admin_pwd') ?? password;
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${pwd}` } });
    if (res.ok) setUsers(await res.json());
    setUsersLoading(false);
  }

  async function patchUser(id: string, data: Record<string, unknown>) {
    const pwd = sessionStorage.getItem('27c_admin_pwd') ?? password;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pwd}` },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(us => us.map(u => u.id === id ? { ...u, ...updated } : u));
      showToast('更新成功');
    } else showToast('更新失败', false);
  }

  async function deleteUser(id: string) {
    if (!confirm('确认删除此用户？其 API Key 也将被删除')) return;
    const pwd = sessionStorage.getItem('27c_admin_pwd') ?? password;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${pwd}` },
    });
    if (res.ok) { setUsers(us => us.filter(u => u.id !== id)); showToast('用户已删除'); }
    else showToast('删除失败', false);
  }

  async function loadModelPricing() {
    setModelsLoading(true);
    const pwd = sessionStorage.getItem('27c_admin_pwd') ?? password;
    const [modelsRes, pricesRes] = await Promise.all([
      fetch('/v1/models', { headers: { Authorization: `Bearer ${pwd}` } }),
      fetch('/api/admin/model-prices', { headers: { Authorization: `Bearer ${pwd}` } }),
    ]);
    if (modelsRes.ok) {
      const d = await modelsRes.json();
      setModelList(Array.isArray(d?.data) ? d.data.map((m: { id: string }) => m.id).sort() : []);
    }
    if (pricesRes.ok) {
      const d = await pricesRes.json();
      setModelPrices(d.prices ?? {});
      setOfficialPrices(d.official ?? {});
    }
    setModelsLoading(false);
  }

  async function saveModelPrice(modelId: string, data: { inputPer1M: number; outputPer1M: number; perRequest: number; enabled: boolean; markup?: number }) {
    const pwd = sessionStorage.getItem('27c_admin_pwd') ?? password;
    const res = await fetch('/api/admin/model-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pwd}` },
      body: JSON.stringify({ modelId, ...data }),
    });
    if (res.ok) {
      const official = officialPrices[modelId];
      const markup = data.markup && data.markup > 0 ? data.markup : undefined;
      const computed = markup && official
        ? { inputPer1M: official.input * markup, outputPer1M: official.output * markup }
        : { inputPer1M: data.inputPer1M, outputPer1M: data.outputPer1M };
      setModelPrices(p => ({ ...p, [modelId]: { ...data, ...computed } }));
      setEditingPrice(null);
      showToast(`${modelId} 定价已保存`);
    } else showToast('保存失败', false);
  }

  async function applyGlobalMarkup() {
    const m = parseFloat(globalMarkup);
    if (!m || m <= 0) { showToast('请输入有效的折扣倍率', false); return; }
    const pwd = sessionStorage.getItem('27c_admin_pwd') ?? password;
    const toSave = modelList.filter(id => officialPrices[id]);
    let ok = 0;
    for (const modelId of toSave) {
      const official = officialPrices[modelId];
      if (!official) continue;
      const existing = modelPrices[modelId];
      await fetch('/api/admin/model-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pwd}` },
        body: JSON.stringify({ modelId, markup: m, perRequest: existing?.perRequest ?? 0, enabled: existing?.enabled ?? true }),
      });
      ok++;
    }
    setModelPrices(prev => {
      const next = { ...prev };
      for (const modelId of toSave) {
        const official = officialPrices[modelId];
        if (!official) continue;
        const existing = prev[modelId];
        next[modelId] = { inputPer1M: official.input * m, outputPer1M: official.output * m, perRequest: existing?.perRequest ?? 0, enabled: existing?.enabled ?? true, markup: m };
      }
      return next;
    });
    showToast(`已对 ${ok} 个已知官方价格的模型应用 ${m}× 倍率`);
  }

  async function testModel(modelId: string) {
    setTestResults(r => ({ ...r, [modelId]: { ok: false, loading: true } }));
    const pwd = sessionStorage.getItem('27c_admin_pwd') ?? password;
    try {
      const res = await fetch('/api/admin/test-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pwd}` },
        body: JSON.stringify({ modelId }),
      });
      const d = await res.json();
      setTestResults(r => ({ ...r, [modelId]: { ok: d.ok, latency: d.latency, error: d.error, loading: false } }));
    } catch (e) {
      setTestResults(r => ({ ...r, [modelId]: { ok: false, error: String(e), loading: false } }));
    }
  }

  async function deleteModelPrice(modelId: string) {
    const pwd = sessionStorage.getItem('27c_admin_pwd') ?? password;
    await fetch(`/api/admin/model-prices?modelId=${encodeURIComponent(modelId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${pwd}` },
    });
    setModelPrices(p => { const n = { ...p }; delete n[modelId]; return n; });
    showToast(`${modelId} 定价已清除`);
  }

  async function createUser() {
    const pwd = sessionStorage.getItem('27c_admin_pwd') ?? password;
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pwd}` },
      body: JSON.stringify({ ...createUserForm, balance: parseFloat(createUserForm.balance) || 0 }),
    });
    if (res.ok) {
      showToast('用户创建成功');
      setShowCreateUser(false);
      setCreateUserForm({ username: '', email: '', password: '', role: 'user', balance: '0' });
      loadUsers();
    } else {
      const d = await res.json();
      showToast(d.error || '创建失败', false);
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clay-100 px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta-500 shadow-lg">
              <Lock size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-clay-900">管理面板</h1>
            <p className="mt-1 text-clay-500 text-sm">输入管理员密码继续</p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); login(password); }}
            className="card flex flex-col gap-4"
          >
            <div>
              <label className="label">管理员密码</label>
              <input
                type="password"
                className="input"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {authError && (
              <p className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle size={13} /> {authError}
              </p>
            )}
            <button type="submit" disabled={authLoading || !password} className="btn-primary justify-center">
              {authLoading ? '验证中…' : '进入管理面板'}
            </button>
            <Link href="/" className="flex items-center justify-center gap-1.5 text-sm text-clay-500 hover:text-clay-800">
              <Home size={13} /> 返回首页
            </Link>
          </form>
          <p className="mt-4 text-center text-xs text-clay-400">默认密码：27capi（请登录后立即修改）</p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-clay-100">
      <header className="sticky top-0 z-50 border-b border-clay-200 bg-clay-50/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <h1 className="text-lg font-bold text-clay-900">管理面板</h1>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost flex items-center gap-1.5 text-sm">
              <Home size={14} /> 前台首页 <ExternalLink size={11} />
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              <Save size={14} />
              {saving ? '保存中…' : '保存配置'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl gap-6 px-6 py-8">
        {/* Sidebar */}
        <aside className="w-44 shrink-0">
          <nav className="flex flex-col gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-all ${
                  tab === id
                    ? 'bg-terracotta-100 text-terracotta-700'
                    : 'text-clay-600 hover:bg-clay-200'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {tab === 'site' && (
            <div className="card flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-clay-900">站点设置</h2>
                <p className="text-sm text-clay-500 mt-0.5">自定义站点名称、描述等基本信息</p>
              </div>
              <hr className="border-clay-200" />
              <div className="grid gap-5">
                <div>
                  <label className="label">站点名称</label>
                  <input
                    type="text"
                    className="input"
                    value={form.siteName}
                    onChange={(e) => updateForm('siteName', e.target.value)}
                    placeholder="27c API"
                  />
                </div>
                <div>
                  <label className="label">站点描述</label>
                  <input
                    type="text"
                    className="input"
                    value={form.siteDescription}
                    onChange={(e) => updateForm('siteDescription', e.target.value)}
                    placeholder="高速稳定的 OpenAI 兼容 API 中转服务"
                  />
                </div>
                <div>
                  <label className="label">SEO 关键词</label>
                  <input
                    type="text"
                    className="input"
                    value={form.siteKeyword}
                    onChange={(e) => updateForm('siteKeyword', e.target.value)}
                    placeholder="API中转, OpenAI, Claude, AI接口"
                  />
                </div>
                <div>
                  <label className="label">公告栏文本 <span className="text-clay-400 font-normal">（留空则不显示）</span></label>
                  <input
                    type="text"
                    className="input"
                    value={form.announcement}
                    onChange={(e) => updateForm('announcement', e.target.value)}
                    placeholder="例：服务升级维护，预计 XX 日恢复"
                  />
                </div>
                <div>
                  <label className="label">自定义 CSS <span className="text-clay-400 font-normal">（高级）</span></label>
                  <textarea
                    className="input min-h-[80px] font-mono text-xs resize-y"
                    value={form.customCss}
                    onChange={(e) => updateForm('customCss', e.target.value)}
                    placeholder=".navbar { background: #fff; }"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'upstream' && (
            <div className="flex flex-col gap-6">
              <div className="card flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-clay-900">上游渠道管理</h2>
                    <p className="text-sm text-clay-500 mt-0.5">支持多个上游渠道，按权重随机负载均衡</p>
                  </div>
                  <button
                    className="btn-primary text-sm"
                    onClick={() => {
                      setEditingUpstream({ id: crypto.randomUUID(), name: '', baseUrl: '', apiKey: '', timeout: 60000, enabled: true, weight: 1 });
                      setShowAddUpstream(true);
                    }}
                  >
                    <Plus size={14} /> 添加渠道
                  </button>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-terracotta-200 bg-terracotta-50 p-4 text-sm text-terracotta-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>上游密钥仅在服务器侧使用，不会暴露给用户。开启多个渠道时按权重加权随机选择。</p>
                </div>

                {showAddUpstream && editingUpstream && (
                  <div className="rounded-xl border border-clay-200 bg-clay-50 p-5 grid gap-4">
                    <p className="text-sm font-semibold text-clay-800">{form.upstreams.some(u => u.id === editingUpstream.id) ? '编辑渠道' : '添加渠道'}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">渠道名称</label>
                        <input className="input" value={editingUpstream.name}
                          onChange={e => setEditingUpstream(u => u && ({ ...u, name: e.target.value }))}
                          placeholder="OpenAI / Claude / 自建" />
                      </div>
                      <div>
                        <label className="label">权重 <span className="text-clay-400 font-normal">(越大被选概率越高)</span></label>
                        <input className="input" type="number" min={1} value={editingUpstream.weight}
                          onChange={e => setEditingUpstream(u => u && ({ ...u, weight: parseInt(e.target.value) || 1 }))} />
                      </div>
                    </div>
                    <div>
                      <label className="label">API 地址</label>
                      <input className="input" type="url" value={editingUpstream.baseUrl}
                        onChange={e => setEditingUpstream(u => u && ({ ...u, baseUrl: e.target.value }))}
                        placeholder="https://api.openai.com" />
                      <p className="mt-1 text-xs text-clay-400">不要包含 /v1</p>
                    </div>
                    <div>
                      <label className="label">API Key <span className="text-clay-400 font-normal">(留空保持原有)</span></label>
                      <input className="input font-mono" type="password"
                        value={editingUpstream.apiKey}
                        onChange={e => setEditingUpstream(u => u && ({ ...u, apiKey: e.target.value }))}
                        placeholder="输入密钥"
                        autoComplete="new-password" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">超时(毫秒)</label>
                        <input className="input" type="number" min={5000} max={300000} step={1000}
                          value={editingUpstream.timeout}
                          onChange={e => setEditingUpstream(u => u && ({ ...u, timeout: parseInt(e.target.value) || 60000 }))} />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input type="checkbox" checked={editingUpstream.enabled}
                            onChange={e => setEditingUpstream(u => u && ({ ...u, enabled: e.target.checked }))}
                            className="w-4 h-4 rounded" />
                          启用该渠道
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary" onClick={() => { setShowAddUpstream(false); setEditingUpstream(null); }}>取消</button>
                      <button className="btn-primary" onClick={() => {
                        if (!editingUpstream) return;
                        setForm(f => {
                          if (!f) return f;
                          const exists = f.upstreams.some(u => u.id === editingUpstream.id);
                          const upstreams = exists
                            ? f.upstreams.map(u => u.id === editingUpstream.id ? editingUpstream : u)
                            : [...f.upstreams, editingUpstream];
                          return { ...f, upstreams };
                        });
                        setShowAddUpstream(false);
                        setEditingUpstream(null);
                      }}>确定</button>
                    </div>
                  </div>
                )}

                {form.upstreams.length === 0 ? (
                  <div className="text-center py-8 text-clay-400">
                    <Server size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">暂无渠道，点击「添加渠道」创建第一个</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.upstreams.map((ch, idx) => (
                      <div key={ch.id} className="flex items-center gap-3 rounded-xl border border-clay-200 bg-white px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-clay-800 text-sm">{ch.name || '未命名渠道'}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ch.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-clay-200 text-clay-500'}`}>
                              {ch.enabled ? '启用' : '停用'}
                            </span>
                            <span className="text-xs text-clay-400">权重 {ch.weight}</span>
                          </div>
                          <p className="text-xs text-clay-400 mt-0.5 truncate">{ch.baseUrl || '未设置地址'}</p>
                        </div>
                        <button className="text-xs text-clay-500 hover:text-terracotta-600 px-2 py-1 rounded hover:bg-clay-100"
                          onClick={() => { setEditingUpstream({ ...ch }); setShowAddUpstream(true); }}>
                          编辑
                        </button>
                        <button className="p-1.5 rounded-lg text-clay-400 hover:bg-red-50 hover:text-red-500"
                          onClick={() => setForm(f => f && ({ ...f, upstreams: f.upstreams.filter((_, i) => i !== idx) }))}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card flex flex-col gap-6">
                <div>
                  <h2 className="text-base font-bold text-clay-900">备用单上游（兼容旧配置）</h2>
                  <p className="text-sm text-clay-500 mt-0.5">当上方渠道列表为空时使用此设置</p>
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="label">API 地址</label>
                    <input type="url" className="input" value={form.upstreamBaseUrl}
                      onChange={(e) => updateForm('upstreamBaseUrl', e.target.value)}
                      placeholder="https://api.openai.com" />
                    <p className="mt-1.5 text-xs text-clay-400">不要包含 /v1</p>
                  </div>
                  <div>
                    <label className="label">API Key <span className="text-clay-400 font-normal">(留空保持不变)</span></label>
                    <div className="relative">
                      <input type={showKey ? 'text' : 'password'} className="input pr-10"
                        value={form.upstreamApiKey}
                        onChange={(e) => updateForm('upstreamApiKey', e.target.value)}
                        placeholder="输入新密钥" autoComplete="new-password" />
                      <button type="button" onClick={() => setShowKey(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-clay-400 hover:text-clay-700">
                        {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">超时时间（毫秒）</label>
                    <input type="number" className="input" value={form.upstreamTimeout}
                      onChange={(e) => updateForm('upstreamTimeout', Number(e.target.value))}
                      min={5000} max={300000} step={1000} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'branding' && (
            <div className="card flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-clay-900">品牌定制</h2>
                <p className="text-sm text-clay-500 mt-0.5">上传自定义 Logo 和 Favicon</p>
              </div>
              <hr className="border-clay-200" />
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="label">Logo 图片</label>
                  <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-clay-300 bg-clay-100 p-6 hover:border-clay-400 transition-colors">
                    {form.logoUrl ? (
                      <Image src={form.logoUrl} alt="Logo" width={64} height={64} className="rounded-lg object-contain" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-clay-200 text-clay-400">
                        <Palette size={28} />
                      </div>
                    )}
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      <Upload size={12} />
                      {uploadingLogo ? '上传中…' : '选择图片'}
                    </button>
                    <p className="text-xs text-clay-400 text-center">PNG / JPG / SVG / WebP，最大 2MB</p>
                    {form.logoUrl && (
                      <button
                        onClick={() => updateForm('logoUrl', null)}
                        className="text-xs text-clay-400 hover:text-red-500 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw size={11} /> 移除 Logo
                      </button>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e, 'logo')}
                  />
                </div>
                <div>
                  <label className="label">Favicon 图标</label>
                  <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-clay-300 bg-clay-100 p-6 hover:border-clay-400 transition-colors">
                    {form.faviconUrl ? (
                      <Image src={form.faviconUrl} alt="Favicon" width={32} height={32} className="rounded object-contain" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-clay-200 text-clay-400">
                        <Settings size={28} />
                      </div>
                    )}
                    <button
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      <Upload size={12} />
                      {uploadingLogo ? '上传中…' : '选择图标'}
                    </button>
                    <p className="text-xs text-clay-400 text-center">推荐 PNG / ICO，最大 2MB</p>
                    {form.faviconUrl && (
                      <button
                        onClick={() => updateForm('faviconUrl', null)}
                        className="text-xs text-clay-400 hover:text-red-500 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw size={11} /> 移除 Favicon
                      </button>
                    )}
                  </div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e, 'favicon')}
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'access' && (
            <div className="card flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-clay-900">访问控制</h2>
                <p className="text-sm text-clay-500 mt-0.5">控制谁可以使用中转接口</p>
              </div>
              <hr className="border-clay-200" />
              <div className="grid gap-5">
                <div className="flex items-center justify-between rounded-xl border border-clay-200 bg-clay-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-clay-800">启用中转密钥验证</p>
                    <p className="text-xs text-clay-500 mt-0.5">开启后，请求必须携带指定 API Key 才能访问</p>
                  </div>
                  <button
                    onClick={() => updateForm('access', { ...form.access, requireRelayKey: !form.access.requireRelayKey })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      form.access.requireRelayKey ? 'bg-terracotta-500' : 'bg-clay-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        form.access.requireRelayKey ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {form.access.requireRelayKey && (
                  <div>
                    <label className="label">中转 API Key</label>
                    <input
                      type="text"
                      className="input font-mono"
                      value={form.access.relayKey}
                      onChange={(e) => updateForm('access', { ...form.access, relayKey: e.target.value })}
                      placeholder="设置用户访问时需要提供的 Key"
                    />
                  </div>
                )}

                <hr className="border-clay-200" />

                <div>
                  <p className="text-sm font-medium text-clay-800 mb-3">修改管理员密码</p>
                  <div className="grid gap-3">
                    <div>
                      <label className="label">新密码 <span className="text-clay-400 font-normal">（至少 6 位，留空不修改）</span></label>
                      <input
                        type="password"
                        className="input"
                        value={form.newAdminPassword}
                        onChange={(e) => updateForm('newAdminPassword', e.target.value)}
                        placeholder="输入新密码"
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label className="label">确认新密码</label>
                      <input
                        type="password"
                        className="input"
                        value={form.confirmAdminPassword}
                        onChange={(e) => updateForm('confirmAdminPassword', e.target.value)}
                        placeholder="再次输入新密码"
                        autoComplete="new-password"
                      />
                    </div>
                    {form.newAdminPassword && form.confirmAdminPassword &&
                      form.newAdminPassword !== form.confirmAdminPassword && (
                      <p className="flex items-center gap-1.5 text-xs text-red-500">
                        <AlertCircle size={12} /> 两次密码不一致
                      </p>
                    )}
                  </div>
                </div>

                <hr className="border-clay-200" />

                <div>
                  <p className="text-sm font-medium text-clay-800 mb-3 flex items-center gap-1.5"><DollarSign size={14} /> 计费设置</p>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between rounded-xl border border-clay-200 bg-clay-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-clay-800">启用余额计费</p>
                        <p className="text-xs text-clay-500 mt-0.5">开启后，用户 API Key 每次请求扣减对应余额</p>
                      </div>
                      <button
                        onClick={() => updateForm('billing', { ...form.billing, enabled: !form.billing.enabled })}
                        className={`relative h-6 w-11 rounded-full transition-colors ${form.billing.enabled ? 'bg-terracotta-500' : 'bg-clay-300'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.billing.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    {form.billing.enabled && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">每次请求扣减</label>
                          <input type="number" step="0.000001" min="0" className="input" value={form.billing.deductionPerRequest}
                            onChange={e => updateForm('billing', { ...form.billing, deductionPerRequest: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <label className="label">货币符号</label>
                          <input type="text" className="input" maxLength={3} value={form.billing.currency}
                            onChange={e => updateForm('billing', { ...form.billing, currency: e.target.value })} />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between rounded-xl border border-clay-200 bg-clay-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-clay-800">开放用户注册</p>
                        <p className="text-xs text-clay-500 mt-0.5">关闭后只有管理员可以创建账号</p>
                      </div>
                      <button
                        onClick={() => updateForm('registration', { ...form.registration, enabled: !form.registration.enabled })}
                        className={`relative h-6 w-11 rounded-full transition-colors ${form.registration.enabled ? 'bg-terracotta-500' : 'bg-clay-300'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.registration.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <div>
                      <label className="label">新用户初始余额</label>
                      <input type="number" step="0.01" min="0" className="input" value={form.registration.defaultBalance}
                        onChange={e => updateForm('registration', { ...form.registration, defaultBalance: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="card flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-clay-900">用户管理</h2>
                  <p className="text-sm text-clay-500 mt-0.5">管理所有 API 用户账号</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={loadUsers} disabled={usersLoading} className="btn-ghost p-2"><RefreshCw size={14} className={usersLoading ? 'animate-spin' : ''} /></button>
                  <button onClick={() => setShowCreateUser(v => !v)} className="btn-primary text-sm"><Plus size={14} /> 创建用户</button>
                </div>
              </div>

              {showCreateUser && (
                <div className="rounded-xl border border-clay-200 bg-clay-100 p-4 grid gap-3">
                  <p className="text-sm font-medium text-clay-800">创建新用户</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">用户名 *</label>
                      <input className="input" value={createUserForm.username} onChange={e => setCreateUserForm(f => ({ ...f, username: e.target.value }))} placeholder="username" />
                    </div>
                    <div>
                      <label className="label">邮箱</label>
                      <input className="input" type="email" value={createUserForm.email} onChange={e => setCreateUserForm(f => ({ ...f, email: e.target.value }))} placeholder="可选" />
                    </div>
                    <div>
                      <label className="label">密码 *</label>
                      <input className="input" type="password" value={createUserForm.password} onChange={e => setCreateUserForm(f => ({ ...f, password: e.target.value }))} placeholder="至少 6 位" />
                    </div>
                    <div>
                      <label className="label">初始余额</label>
                      <input className="input" type="number" step="0.01" min="0" value={createUserForm.balance} onChange={e => setCreateUserForm(f => ({ ...f, balance: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="label mb-0">角色：</label>
                    {(['user', 'admin'] as const).map(r => (
                      <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input type="radio" name="role" value={r} checked={createUserForm.role === r} onChange={() => setCreateUserForm(f => ({ ...f, role: r }))} />
                        {r === 'admin' ? '管理员' : '普通用户'}
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowCreateUser(false)} className="btn-secondary">取消</button>
                    <button onClick={createUser} className="btn-primary">确认创建</button>
                  </div>
                </div>
              )}

              {users.length === 0 ? (
                <div className="text-center py-10 text-clay-400">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">暂无用户，点击「创建用户」或「刷新」加载</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-clay-200 text-left text-clay-500 text-xs">
                        <th className="pb-3 font-medium">用户名</th>
                        <th className="pb-3 font-medium">角色</th>
                        <th className="pb-3 font-medium text-center">状态</th>
                        <th className="pb-3 font-medium text-right">Key 数</th>
                        <th className="pb-3 font-medium text-right">余额</th>
                        <th className="pb-3 font-medium text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-clay-100">
                      {users.map(u => (
                        <tr key={u.id} className="group align-middle">
                          <td className="py-3">
                            <p className="font-medium text-clay-800">{u.username}</p>
                            <p className="text-xs text-clay-400">{u.email ?? '未绑定邮箱'}</p>
                          </td>
                          <td className="py-3">
                            <span className={`badge ${u.role === 'admin' ? 'bg-terracotta-50 text-terracotta-600' : 'bg-clay-200 text-clay-600'}`}>
                              {u.role === 'admin' ? '管理员' : '用户'}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <button onClick={() => patchUser(u.id, { status: u.status === 'active' ? 'suspended' : 'active' })}
                              title={u.status === 'active' ? '点击禁用' : '点击启用'}>
                              {u.status === 'active'
                                ? <ToggleRight size={20} className="text-emerald-500 mx-auto" />
                                : <ToggleLeft size={20} className="text-clay-400 mx-auto" />}
                            </button>
                          </td>
                          <td className="py-3 text-right text-clay-500">{u.keyCount}</td>
                          <td className="py-3 text-right">
                            {editBalance?.id === u.id ? (
                              <div className="flex items-center justify-end gap-1">
                                <input type="number" step="0.01" className="input py-1 w-24 text-right text-xs"
                                  value={editBalance.value}
                                  onChange={e => setEditBalance({ id: u.id, value: e.target.value })} />
                                <button onClick={() => { patchUser(u.id, { balance: parseFloat(editBalance.value) || 0 }); setEditBalance(null); }}
                                  className="text-xs text-emerald-600 font-medium px-2 py-1 rounded hover:bg-emerald-50">确定</button>
                                <button onClick={() => setEditBalance(null)} className="text-xs text-clay-400 px-1">✕</button>
                              </div>
                            ) : (
                              <button onClick={() => setEditBalance({ id: u.id, value: String(u.balance) })}
                                className="font-mono text-clay-700 hover:text-terracotta-500 transition-colors">
                                ¥{u.balance.toFixed(4)}
                              </button>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button onClick={() => deleteUser(u.id)}
                              className="p-1.5 rounded-lg text-clay-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'email' && (
            <div className="card flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-clay-900">邮件服务配置</h2>
                <p className="text-sm text-clay-500 mt-0.5">SMTP 发信设置 + 邮筱验证功能</p>
              </div>
              <hr className="border-clay-200" />
              <div className="grid gap-5">
                <div>
                  <label className="label">SMTP 主机</label>
                  <input className="input"
                    value={form.smtp.host}
                    onChange={e => updateForm('smtp', { ...form.smtp, host: e.target.value })}
                    placeholder="smtp.gmail.com / smtp.qq.com / smtp.resend.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">端口</label>
                    <input className="input" type="number"
                      value={form.smtp.port}
                      onChange={e => updateForm('smtp', { ...form.smtp, port: parseInt(e.target.value) || 587 })}
                      placeholder="587 (TLS) / 465 (SSL)" />
                  </div>
                  <div>
                    <label className="label">发件人名称</label>
                    <input className="input"
                      value={form.smtp.fromName}
                      onChange={e => updateForm('smtp', { ...form.smtp, fromName: e.target.value })}
                      placeholder="27c API" />
                  </div>
                </div>
                <div>
                  <label className="label">SMTP 用户名 / 邮筱</label>
                  <input className="input"
                    value={form.smtp.user}
                    onChange={e => updateForm('smtp', { ...form.smtp, user: e.target.value })}
                    placeholder="noreply@example.com" />
                </div>
                <div>
                  <label className="label">SMTP 密码 / 专用密码</label>
                  <input className="input" type="password"
                    value={form.smtp.pass}
                    onChange={e => updateForm('smtp', { ...form.smtp, pass: e.target.value })}
                    placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">发件人邮筱 <span className="text-clay-400 font-normal">(可选，默认使用用户名)</span></label>
                  <input className="input"
                    value={form.smtp.fromEmail}
                    onChange={e => updateForm('smtp', { ...form.smtp, fromEmail: e.target.value })}
                    placeholder="noreply@example.com" />
                </div>
              </div>
              <hr className="border-clay-200" />
              <div className="flex items-center justify-between p-4 rounded-xl border border-clay-200 bg-clay-50">
                <div>
                  <h3 className="font-medium text-clay-900">邮筱验证</h3>
                  <p className="text-xs text-clay-500 mt-0.5">注册时发送验证邮件，防止恶意批量注册</p>
                </div>
                <button
                  onClick={() => updateForm('emailVerification', { ...form.emailVerification, enabled: !form.emailVerification.enabled })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    form.emailVerification.enabled ? 'bg-terracotta-500' : 'bg-clay-300'
                  }`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    form.emailVerification.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              {form.emailVerification.enabled && (
                <div>
                  <label className="label">邮筱域名白名单 <span className="text-clay-400 font-normal">(每行一个域名，留空则允许所有)</span></label>
                  <textarea className="input min-h-[100px] font-mono text-xs"
                    value={form.emailVerification.whitelist.join('\n')}
                    onChange={e => updateForm('emailVerification', {
                      ...form.emailVerification,
                      whitelist: e.target.value.split('\n').map(d => d.trim()).filter(Boolean)
                    })}
                    placeholder="gmail.com&#10;qq.com&#10;163.com" />
                  <p className="text-xs text-clay-400 mt-1.5">仅允许指定后缀的邮筱注册，有效防止批量垃圾账号</p>
                </div>
              )}
            </div>
          )}

          {tab === 'pricing' && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-clay-900">模型定价</h2>
                  <p className="text-sm text-clay-500 mt-0.5">从官方原价自动计算，只需填写折扣倍率</p>
                </div>
                <button onClick={loadModelPricing} disabled={modelsLoading} className="btn-secondary text-sm">
                  <RefreshCw size={13} className={modelsLoading ? 'animate-spin' : ''} /> {modelsLoading ? '加载中…' : '刷新列表'}
                </button>
              </div>

              {/* Global markup */}
              <div className="card flex items-center gap-4 py-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-clay-800">全局折扣倍率</p>
                  <p className="text-xs text-clay-500 mt-0.5">一键设置所有有官方价格的模型（官方价 × 倍率 = 售价）。例：1.0 = 原价, 1.5 = 官方1.5倍, 7.3 = 按汇率转人民币</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number" step="0.01" min="0.01"
                    className="input w-24 text-center"
                    value={globalMarkup}
                    onChange={e => setGlobalMarkup(e.target.value)}
                    placeholder="如 7.3"
                  />
                  <span className="text-sm text-clay-500">×</span>
                  <button onClick={applyGlobalMarkup} className="btn-primary text-sm whitespace-nowrap">一键应用</button>
                </div>
              </div>

              {modelList.length === 0 && !modelsLoading && (
                <div className="rounded-xl border border-clay-200 bg-clay-50 p-8 text-center text-clay-400">
                  暂无模型数据，请先配置上游接口并点击「刷新列表」
                </div>
              )}

              {modelList.length > 0 && (
                <div className="rounded-xl border border-clay-200 bg-white overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="border-b border-clay-200 bg-clay-50">
                      <tr>
                        <th className="py-2.5 px-3 text-left font-medium text-clay-600">模型 ID</th>
                        <th className="py-2.5 px-3 text-right font-medium text-clay-600 w-32">官方原价 (USD/1M)</th>
                        <th className="py-2.5 px-3 text-center font-medium text-clay-600 w-20">倍率</th>
                        <th className="py-2.5 px-3 text-right font-medium text-clay-600 w-28">售价输入/1M</th>
                        <th className="py-2.5 px-3 text-right font-medium text-clay-600 w-28">售价输出/1M</th>
                        <th className="py-2.5 px-3 text-center font-medium text-clay-600 w-14">启用</th>
                        <th className="py-2.5 px-3 text-right font-medium text-clay-600 w-36">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelList.map(modelId => {
                        const p = modelPrices[modelId];
                        const off = officialPrices[modelId];
                        const editing = editingPrice?.modelId === modelId;
                        const tr = testResults[modelId];

                        const previewMarkup = editing ? parseFloat(editingPrice.markup) : (p?.markup ?? 0);
                        const previewInput = editing
                          ? (previewMarkup > 0 && off ? off.input * previewMarkup : parseFloat(editingPrice.inputPer1M) || 0)
                          : (p?.inputPer1M ?? 0);
                        const previewOutput = editing
                          ? (previewMarkup > 0 && off ? off.output * previewMarkup : parseFloat(editingPrice.outputPer1M) || 0)
                          : (p?.outputPer1M ?? 0);

                        return (
                          <tr key={modelId} className="border-b border-clay-100 last:border-0 hover:bg-clay-50 transition-colors">
                            {/* Model ID + test result */}
                            <td className="py-2 px-3">
                              <p className="font-mono text-clay-800 truncate max-w-[180px]" title={modelId}>{modelId}</p>
                              {tr && !tr.loading && (
                                <p className={`text-xs mt-0.5 ${tr.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {tr.ok ? `✓ ${tr.latency}ms` : `✗ ${tr.error?.slice(0, 40)}`}
                                </p>
                              )}
                            </td>

                            {/* Official price */}
                            <td className="py-2 px-3 text-right">
                              {off ? (
                                <span className="text-clay-500">
                                  {off.input > 0 ? `$${off.input}` : <span className="text-emerald-600">免费</span>}
                                  {off.input > 0 && <span className="text-clay-300"> / ${off.output}</span>}
                                  {off.note && <span className="text-clay-300 ml-1">({off.note})</span>}
                                </span>
                              ) : (
                                <span className="text-clay-300">—</span>
                              )}
                            </td>

                            {/* Markup input */}
                            <td className="py-2 px-3 text-center">
                              {editing ? (
                                <input type="number" step="0.01" min="0"
                                  className="input py-0.5 w-16 text-center text-xs"
                                  value={editingPrice.markup}
                                  onChange={e => setEditingPrice(ep => ep && ({ ...ep, markup: e.target.value }))}
                                  placeholder="倍率"
                                />
                              ) : (
                                <span className={p?.markup ? 'text-terracotta-600 font-medium' : 'text-clay-300'}>
                                  {p?.markup ? `${p.markup}×` : '—'}
                                </span>
                              )}
                            </td>

                            {/* Selling price input */}
                            <td className="py-2 px-3 text-right">
                              {editing ? (
                                <input type="number" step="0.001" min="0"
                                  className={`input py-0.5 w-24 text-right text-xs ${parseFloat(editingPrice.markup) > 0 && off ? 'bg-clay-50 text-clay-400' : ''}`}
                                  value={parseFloat(editingPrice.markup) > 0 && off ? (off.input * parseFloat(editingPrice.markup)).toFixed(4) : editingPrice.inputPer1M}
                                  onChange={e => setEditingPrice(ep => ep && ({ ...ep, inputPer1M: e.target.value, markup: '' }))}
                                  readOnly={parseFloat(editingPrice.markup) > 0 && !!off}
                                />
                              ) : (
                                <span className={previewInput > 0 ? 'text-clay-700' : 'text-clay-300'}>
                                  {previewInput > 0 ? previewInput.toFixed(4) : '—'}
                                </span>
                              )}
                            </td>

                            {/* Selling price output */}
                            <td className="py-2 px-3 text-right">
                              {editing ? (
                                <input type="number" step="0.001" min="0"
                                  className={`input py-0.5 w-24 text-right text-xs ${parseFloat(editingPrice.markup) > 0 && off ? 'bg-clay-50 text-clay-400' : ''}`}
                                  value={parseFloat(editingPrice.markup) > 0 && off ? (off.output * parseFloat(editingPrice.markup)).toFixed(4) : editingPrice.outputPer1M}
                                  onChange={e => setEditingPrice(ep => ep && ({ ...ep, outputPer1M: e.target.value, markup: '' }))}
                                  readOnly={parseFloat(editingPrice.markup) > 0 && !!off}
                                />
                              ) : (
                                <span className={previewOutput > 0 ? 'text-clay-700' : 'text-clay-300'}>
                                  {previewOutput > 0 ? previewOutput.toFixed(4) : '—'}
                                </span>
                              )}
                            </td>

                            {/* Enabled toggle */}
                            <td className="py-2 px-3 text-center">
                              {editing ? (
                                <input type="checkbox" checked={editingPrice.enabled}
                                  onChange={e => setEditingPrice(ep => ep && ({ ...ep, enabled: e.target.checked }))}
                                  className="w-3.5 h-3.5 rounded cursor-pointer" />
                              ) : (
                                p?.enabled === false
                                  ? <ToggleLeft size={15} className="text-clay-300 mx-auto" />
                                  : <ToggleRight size={15} className={`mx-auto ${p ? 'text-emerald-500' : 'text-clay-200'}`} />
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Test button */}
                                <button
                                  onClick={() => testModel(modelId)}
                                  disabled={tr?.loading}
                                  title="测试连通性"
                                  className={`px-1.5 py-1 rounded text-xs font-medium transition-colors ${
                                    tr?.loading ? 'text-clay-300 cursor-wait' :
                                    tr?.ok ? 'text-emerald-600 hover:bg-emerald-50' :
                                    tr && !tr.ok ? 'text-red-500 hover:bg-red-50' :
                                    'text-clay-400 hover:bg-clay-100'
                                  }`}
                                >
                                  {tr?.loading ? '…' : '测试'}
                                </button>

                                {editing ? (
                                  <>
                                    <button onClick={() => saveModelPrice(modelId, {
                                      inputPer1M: parseFloat(editingPrice.markup) > 0 && off ? off.input * parseFloat(editingPrice.markup) : (parseFloat(editingPrice.inputPer1M) || 0),
                                      outputPer1M: parseFloat(editingPrice.markup) > 0 && off ? off.output * parseFloat(editingPrice.markup) : (parseFloat(editingPrice.outputPer1M) || 0),
                                      perRequest: parseFloat(editingPrice.perRequest) || 0,
                                      enabled: editingPrice.enabled,
                                      markup: parseFloat(editingPrice.markup) > 0 ? parseFloat(editingPrice.markup) : undefined,
                                    })} className="px-2 py-1 rounded text-xs font-medium text-emerald-600 hover:bg-emerald-50">保存</button>
                                    <button onClick={() => setEditingPrice(null)} className="px-1 py-1 rounded text-xs text-clay-400 hover:bg-clay-100">✕</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => setEditingPrice({ modelId, markup: String(p?.markup ?? ''), inputPer1M: String(p?.inputPer1M ?? 0), outputPer1M: String(p?.outputPer1M ?? 0), perRequest: String(p?.perRequest ?? 0), enabled: p?.enabled !== false })}
                                      className="px-2 py-1 rounded text-xs text-clay-500 hover:bg-clay-100">设置</button>
                                    {p && <button onClick={() => deleteModelPrice(modelId)} className="px-1.5 py-1 rounded text-xs text-red-400 hover:bg-red-50">清除</button>}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
