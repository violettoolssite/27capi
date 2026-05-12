'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  baseUrl: string;
}

type LangKey = 'python' | 'nodejs' | 'curl';

const examples: Record<LangKey, { label: string; code: (url: string) => string }> = {
  python: {
    label: 'Python',
    code: (url) => `from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="${url}",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "Hello!"},
    ],
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)`,
  },
  nodejs: {
    label: 'Node.js',
    code: (url) => `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'your-api-key',
  baseURL: '${url}',
});

const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}`,
  },
  curl: {
    label: 'cURL',
    code: (url) => `curl ${url}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-key" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'`,
  },
};

export default function QuickStart({ baseUrl }: Props) {
  const [lang, setLang] = useState<LangKey>('python');
  const [copied, setCopied] = useState(false);

  const code = examples[lang].code(baseUrl);

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <section id="quickstart" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10">
        <h2 className="section-title">快速开始</h2>
        <p className="section-sub">与所有 OpenAI 兼容的 SDK 无缝集成</p>
      </div>

      <div className="rounded-2xl border border-clay-200 bg-clay-50 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-clay-200 px-4 py-3">
          <div className="flex gap-1">
            {(Object.keys(examples) as LangKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setLang(k)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  lang === k
                    ? 'bg-terracotta-500 text-white shadow-sm'
                    : 'text-clay-600 hover:bg-clay-200'
                }`}
              >
                {examples[k].label}
              </button>
            ))}
          </div>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-clay-500 hover:bg-clay-200 transition-colors"
          >
            {copied ? (
              <><Check size={13} className="text-green-500" /> 已复制</>
            ) : (
              <><Copy size={13} /> 复制</>
            )}
          </button>
        </div>
        <pre className="overflow-x-auto p-5 text-sm leading-relaxed text-clay-800 font-mono bg-clay-100">
          <code>{code}</code>
        </pre>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-clay-200 bg-clay-50 p-4">
          <p className="text-xs font-semibold text-clay-500 uppercase tracking-wide mb-1">接入地址</p>
          <p className="text-sm font-mono text-clay-800 break-all">{baseUrl}</p>
        </div>
        <div className="rounded-xl border border-clay-200 bg-clay-50 p-4">
          <p className="text-xs font-semibold text-clay-500 uppercase tracking-wide mb-1">协议兼容</p>
          <p className="text-sm text-clay-800">OpenAI API v1</p>
        </div>
        <div className="rounded-xl border border-clay-200 bg-clay-50 p-4">
          <p className="text-xs font-semibold text-clay-500 uppercase tracking-wide mb-1">流式响应</p>
          <p className="text-sm text-clay-800">Server-Sent Events (SSE)</p>
        </div>
      </div>
    </section>
  );
}
