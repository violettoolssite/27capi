'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, LogIn, UserPlus, MailCheck } from 'lucide-react';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '操作失败'); return; }
      if (data.requiresVerification) {
        setSuccessMsg(data.message || '请查收验证邮件后登录');
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-clay-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-clay-900 hover:opacity-80">27c API</Link>
          <p className="text-clay-500 text-sm mt-2">
            {mode === 'login' ? '登录您的账号' : '创建新账号'}
          </p>
        </div>

        <div className="card">
          <div className="flex rounded-xl bg-clay-200 p-1 mb-6 gap-1">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? 'bg-clay-50 text-clay-900 shadow-sm' : 'text-clay-500 hover:text-clay-700'
                }`}
              >
                {m === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="label">用户名</label>
              <input
                className="input"
                type="text"
                placeholder="3-32 位字母数字"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required autoFocus
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="label">邮箱 <span className="text-clay-400 font-normal">（选填）</span></label>
                <input
                  className="input"
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            )}

            <div>
              <label className="label">密码</label>
              <input
                className="input"
                type="password"
                placeholder={mode === 'register' ? '至少 6 位' : '输入密码'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle size={13} /> {error}
              </p>
            )}
            {successMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <MailCheck size={15} className="shrink-0 mt-0.5" /> {successMsg}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary justify-center mt-1">
              {loading ? '处理中…' : mode === 'login' ? (
                <><LogIn size={15} /> 登录</>
              ) : (
                <><UserPlus size={15} /> 注册</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-clay-500 mt-4">
          <Link href="/" className="hover:text-clay-800">← 返回首页</Link>
        </p>
      </div>
    </div>
  );
}
