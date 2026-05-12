'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Key, BarChart2, Plus, Trash2, Copy, Check,
  AlertCircle, CheckCircle, Eye, EyeOff, RefreshCw,
  LogOut, Home, ToggleLeft, ToggleRight,
} from 'lucide-react';

interface UserInfo {
  id: string; username: string; email: string | null;
  role: string; balance: number; status: string;
}
interface ApiKey {
  id: string; name: string; keyPrefix: string;
  status: 'active' | 'disabled'; usageCount: number;
  createdAt: number; lastUsedAt: number | null; expiresAt: number | null;
}
interface UsageLog {
  id: string; model: string | null; promptTokens: number;
  completionTokens: number; totalTokens: number; cost: number;
  requestPath: string | null; statusCode: number | null; createdAt: number;
}

type Tab = 'keys' | 'usage';

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium shadow-lg animate-slide-up ${ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
      {ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {msg}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded-lg text-clay-400 hover:bg-clay-200 hover:text-clay-700 transition-colors">
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}

function NewKeyModal({ onClose, onCreate }: { onClose: () => void; onCreate: (key: ApiKey & { key?: string }) => void }) {
  const [name, setName] = useState('Default Key');
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  async function create() {
    setLoading(true);
    const res = await fetch('/api/user/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await res.json();
    setLoading(false);
    if (res.ok) { setNewKey(data.key); onCreate(data); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-clay-50 rounded-2xl border border-clay-200 p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-clay-900 mb-4">创建 API Key</h3>
        {!newKey ? (
          <>
            <div className="mb-4">
              <label className="label">Key 名称</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="例：My App" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="btn-secondary">取消</button>
              <button onClick={create} disabled={loading} className="btn-primary">{loading ? '创建中…' : '创建'}</button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4 text-sm text-amber-800">
              <p className="font-semibold mb-2">⚠️ 请立即保存此 Key，关闭后将无法再次查看：</p>
              <div className="flex items-center gap-2 rounded-lg bg-white border border-amber-200 px-3 py-2 font-mono text-xs break-all">
                <span className="flex-1">{showKey ? newKey : newKey.slice(0, 16) + '••••••••••••••••••••'}</span>
                <button onClick={() => setShowKey(v => !v)} className="text-amber-400 hover:text-amber-700">{showKey ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                <CopyButton text={newKey} />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="btn-primary">我已保存，关闭</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('keys');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [showNewKey, setShowNewKey] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function notify(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  }

  const loadKeys = useCallback(async () => {
    const res = await fetch('/api/user/keys');
    if (res.ok) setKeys(await res.json());
  }, []);

  const loadLogs = useCallback(async () => {
    const res = await fetch('/api/user/usage?limit=50');
    if (res.ok) { const d = await res.json(); setLogs(d.logs); setLogsTotal(d.total); }
  }, []);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/login'); return null; }
      return r.json();
    }).then(data => {
      if (data) { setUser(data); setLoading(false); loadKeys(); }
    });
  }, [router, loadKeys]);

  useEffect(() => {
    if (tab === 'usage') loadLogs();
  }, [tab, loadLogs]);

  async function toggleKey(key: ApiKey) {
    const next = key.status === 'active' ? 'disabled' : 'active';
    const res = await fetch(`/api/user/keys/${key.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
    if (res.ok) { setKeys(ks => ks.map(k => k.id === key.id ? { ...k, status: next } : k)); notify(`Key 已${next === 'active' ? '启用' : '禁用'}`); }
  }

  async function deleteKey(id: string) {
    if (!confirm('确认删除此 Key？操作不可恢复')) return;
    const res = await fetch(`/api/user/keys/${id}`, { method: 'DELETE' });
    if (res.ok) { setKeys(ks => ks.filter(k => k.id !== id)); notify('Key 已删除'); }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading) {
    return <div className="min-h-screen bg-clay-100 flex items-center justify-center"><RefreshCw size={24} className="animate-spin text-clay-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-clay-100">
      <header className="sticky top-0 z-50 border-b border-clay-200 bg-clay-50/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl flex h-16 items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold text-clay-900 hover:opacity-80">27c API</Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost flex items-center gap-1.5 text-sm"><Home size={14} /> 首页</Link>
            <button onClick={logout} className="btn-ghost flex items-center gap-1.5 text-sm text-clay-500"><LogOut size={14} /> 退出</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="card mb-6 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-clay-900">你好，{user?.username}</p>
            <p className="text-sm text-clay-500">{user?.email || '未绑定邮箱'} · {user?.role === 'admin' ? '管理员' : '普通用户'}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-terracotta-500">¥{user?.balance.toFixed(4)}</p>
            <p className="text-xs text-clay-400">当前余额</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {([['keys', <Key size={14} key="k" />, `API Keys (${keys.length})`], ['usage', <BarChart2 size={14} key="u" />, `用量记录`]] as [Tab, React.ReactNode, string][]).map(([t, icon, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-terracotta-500 text-white shadow-sm' : 'bg-clay-200 text-clay-600 hover:bg-clay-300'}`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {tab === 'keys' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-clay-900">API Keys</h2>
                <p className="text-sm text-clay-500 mt-0.5">用这些 Key 调用中转接口</p>
              </div>
              <button onClick={() => setShowNewKey(true)} className="btn-primary text-sm">
                <Plus size={14} /> 创建 Key
              </button>
            </div>

            {keys.length === 0 ? (
              <div className="text-center py-12 text-clay-400">
                <Key size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无 API Key，点击右上角创建</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-clay-200 text-left text-clay-500 text-xs">
                      <th className="pb-3 font-medium">名称</th>
                      <th className="pb-3 font-medium">Key 前缀</th>
                      <th className="pb-3 font-medium">状态</th>
                      <th className="pb-3 font-medium text-right">调用次数</th>
                      <th className="pb-3 font-medium text-right">创建时间</th>
                      <th className="pb-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-clay-100">
                    {keys.map(key => (
                      <tr key={key.id} className="group">
                        <td className="py-3 font-medium text-clay-800">{key.name}</td>
                        <td className="py-3 font-mono text-clay-500 text-xs">{key.keyPrefix}</td>
                        <td className="py-3">
                          <span className={`badge ${key.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-clay-200 text-clay-500'}`}>
                            {key.status === 'active' ? '启用' : '禁用'}
                          </span>
                        </td>
                        <td className="py-3 text-right text-clay-500">{key.usageCount}</td>
                        <td className="py-3 text-right text-clay-400 text-xs">{new Date(key.createdAt).toLocaleDateString('zh-CN')}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => toggleKey(key)} className="p-1.5 rounded-lg text-clay-400 hover:bg-clay-200 transition-colors" title={key.status === 'active' ? '禁用' : '启用'}>
                              {key.status === 'active' ? <ToggleRight size={15} className="text-emerald-500" /> : <ToggleLeft size={15} />}
                            </button>
                            <button onClick={() => deleteKey(key.id)} className="p-1.5 rounded-lg text-clay-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'usage' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-clay-900">用量记录</h2>
                <p className="text-sm text-clay-500 mt-0.5">共 {logsTotal} 条请求记录</p>
              </div>
              <button onClick={loadLogs} className="btn-ghost p-2"><RefreshCw size={14} /></button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-12 text-clay-400">
                <BarChart2 size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无使用记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-clay-200 text-left text-clay-500 text-xs">
                      <th className="pb-3 font-medium">时间</th>
                      <th className="pb-3 font-medium">接口</th>
                      <th className="pb-3 font-medium text-right">输入 Tokens</th>
                      <th className="pb-3 font-medium text-right">输出 Tokens</th>
                      <th className="pb-3 font-medium text-right">费用</th>
                      <th className="pb-3 font-medium text-right">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-clay-100">
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td className="py-2.5 text-xs text-clay-400">{new Date(log.createdAt).toLocaleString('zh-CN')}</td>
                        <td className="py-2.5 font-mono text-xs text-clay-600">{log.requestPath ?? '-'}</td>
                        <td className="py-2.5 text-right text-clay-500">{log.promptTokens || '-'}</td>
                        <td className="py-2.5 text-right text-clay-500">{log.completionTokens || '-'}</td>
                        <td className="py-2.5 text-right text-clay-700 font-medium">¥{log.cost.toFixed(6)}</td>
                        <td className="py-2.5 text-right">
                          <span className={`badge ${log.statusCode && log.statusCode < 400 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {log.statusCode ?? '?'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showNewKey && (
        <NewKeyModal
          onClose={() => { setShowNewKey(false); loadKeys(); }}
          onCreate={() => {}}
        />
      )}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
