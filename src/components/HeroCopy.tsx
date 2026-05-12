'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  baseUrl: string;
}

export default function HeroCopy({ baseUrl }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(baseUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <div className="mx-auto flex max-w-lg items-center gap-2 rounded-2xl border border-clay-300 bg-clay-50 p-1.5 shadow-sm">
      <code className="flex-1 truncate px-3 text-sm font-mono text-clay-700">{baseUrl}</code>
      <button
        onClick={copy}
        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-terracotta-600 active:scale-95"
      >
        {copied ? (
          <><Check size={13} /> 已复制</>
        ) : (
          <><Copy size={13} /> 复制</>
        )}
      </button>
    </div>
  );
}
