'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) { setState('error'); setMsg('验证链接无效，缺少 token 参数'); return; }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setState('ok');
          setMsg(`邮箱验证成功！欢迎，${d.username}`);
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setState('error');
          setMsg(d.error || '验证失败');
        }
      })
      .catch(() => { setState('error'); setMsg('网络错误，请稍后重试'); });
  }, [token, router]);

  return (
    <div className="min-h-screen bg-clay-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {state === 'loading' && (
          <>
            <RefreshCw size={48} className="animate-spin text-clay-400 mx-auto mb-4" />
            <p className="text-clay-600">正在验证邮箱…</p>
          </>
        )}
        {state === 'ok' && (
          <>
            <CheckCircle size={52} className="text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-clay-900 mb-2">验证成功！</h1>
            <p className="text-clay-600 mb-6">{msg}</p>
            <p className="text-sm text-clay-400">3 秒后自动跳转至登录页…</p>
            <Link href="/login" className="btn-primary mt-4 inline-flex">立即登录</Link>
          </>
        )}
        {state === 'error' && (
          <>
            <XCircle size={52} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-clay-900 mb-2">验证失败</h1>
            <p className="text-clay-600 mb-6">{msg}</p>
            <Link href="/login" className="btn-secondary inline-flex">返回登录</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-clay-100 flex items-center justify-center px-4">
        <RefreshCw size={48} className="animate-spin text-clay-400 mx-auto" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
