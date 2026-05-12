'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';

interface ModelItem {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

interface ProviderInfo {
  label: string;
  color: string;
  bg: string;
}

function getProvider(id: string): ProviderInfo {
  const lower = id.toLowerCase();
  if (/^gpt-|^o1-|^o3-|^o4-|^text-|^dall-/.test(lower))
    return { label: 'OpenAI', color: 'text-emerald-700', bg: 'bg-emerald-50' };
  if (/^claude/.test(lower))
    return { label: 'Anthropic', color: 'text-violet-700', bg: 'bg-violet-50' };
  if (/^gemini|^palm/.test(lower))
    return { label: 'Google', color: 'text-blue-700', bg: 'bg-blue-50' };
  if (/^llama|^meta/.test(lower))
    return { label: 'Meta', color: 'text-indigo-700', bg: 'bg-indigo-50' };
  if (/^deepseek/.test(lower))
    return { label: 'DeepSeek', color: 'text-cyan-700', bg: 'bg-cyan-50' };
  if (/^qwen/.test(lower))
    return { label: 'Alibaba', color: 'text-orange-700', bg: 'bg-orange-50' };
  if (/^mistral|^mixtral/.test(lower))
    return { label: 'Mistral', color: 'text-yellow-700', bg: 'bg-yellow-50' };
  if (/^yi-/.test(lower))
    return { label: '01.AI', color: 'text-red-700', bg: 'bg-red-50' };
  if (/^moonshot|^kimi/.test(lower))
    return { label: 'Moonshot', color: 'text-sky-700', bg: 'bg-sky-50' };
  if (/^glm|^chatglm/.test(lower))
    return { label: 'Zhipu', color: 'text-teal-700', bg: 'bg-teal-50' };
  if (/^grok/.test(lower))
    return { label: 'Grok', color: 'text-gray-700', bg: 'bg-gray-100' };
  if (/^swe/.test(lower))
    return { label: 'SWE', color: 'text-emerald-700', bg: 'bg-emerald-50' };
  if (/^minimax/.test(lower))
    return { label: 'Minimax', color: 'text-purple-700', bg: 'bg-purple-50' };
  return { label: (id.split('/')[0] || 'Other'), color: 'text-clay-600', bg: 'bg-clay-200' };
}

function ModelItemCard({ model }: { model: ModelItem }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(model.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="group flex items-center justify-between rounded-xl border border-clay-200 bg-white px-4 py-2.5 transition-all hover:border-clay-300 hover:shadow-sm">
      <span className="text-sm font-medium text-clay-800 truncate" title={model.id}>{model.id}</span>
      <button
        onClick={copy}
        className="shrink-0 rounded-lg p-1.5 text-clay-400 transition-colors hover:bg-clay-100 hover:text-clay-700"
        title="复制模型 ID"
      >
        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

function ProviderCard({ provider, models }: { provider: string; models: ModelItem[] }) {
  const info = getProvider(models[0].id);

  return (
    <div className="rounded-2xl border border-clay-200 bg-white shadow-sm overflow-hidden">
      <div className={`flex items-center gap-3 px-5 py-4 border-b border-clay-100 ${info.bg}`}>
        <div>
          <h3 className="font-bold text-clay-900">{info.label}</h3>
          <p className="text-xs text-clay-500">{models.length} 个模型</p>
        </div>
      </div>
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
        {models.map((m) => <ModelItemCard key={m.id} model={m} />)}
      </div>
    </div>
  );
}

export default function ModelGrid() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/v1/models');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const list: ModelItem[] = Array.isArray(data?.data) ? data.data : [];
      list.sort((a, b) => a.id.localeCompare(b.id));
      setModels(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '获取模型列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const filtered = search
    ? models.filter((m) => m.id.toLowerCase().includes(search.toLowerCase()))
    : models;

  const grouped = filtered.reduce<Record<string, ModelItem[]>>((acc, m) => {
    const provider = getProvider(m.id).label;
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(m);
    return acc;
  }, {});

  const sortedProviders = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  return (
    <section id="models" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">可用模型</h2>
          <p className="section-sub">实时从上游接口同步，共 {loading ? '…' : models.length} 个模型，{sortedProviders.length} 个提供商</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <input
            type="text"
            placeholder="搜索模型…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-48 text-sm py-2"
          />
          <button
            onClick={fetchModels}
            disabled={loading}
            className="btn-ghost p-2"
            title="刷新"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 rounded-xl border border-terracotta-200 bg-terracotta-50 px-5 py-4 text-sm text-terracotta-700">
          <strong>加载失败：</strong> {error}
          {error.includes('未配置') && (
            <span> — 请先在{' '}
              <a href="/admin" className="underline font-medium">管理面板</a>
              {' '}中配置上游 API。
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-clay-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-clay-400">
          {search ? '没有匹配的模型' : '暂无可用模型'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {sortedProviders.map(([provider, providerModels]) => (
            <ProviderCard key={provider} provider={provider} models={providerModels} />
          ))}
        </div>
      )}
    </section>
  );
}
