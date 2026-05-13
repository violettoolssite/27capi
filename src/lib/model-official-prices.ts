export interface OfficialPrice {
  input: number;   // USD per 1M tokens
  output: number;  // USD per 1M tokens
  note?: string;
}

export const OFFICIAL_PRICES: Record<string, OfficialPrice> = {
  // ── OpenAI ──────────────────────────────────────────────
  'gpt-4.1':                       { input: 2,     output: 8 },
  'gpt-4.1-mini':                  { input: 0.4,   output: 1.6 },
  'gpt-4.1-nano':                  { input: 0.1,   output: 0.4 },
  'gpt-4o':                        { input: 2.5,   output: 10 },
  'gpt-4o-2024-11-20':             { input: 2.5,   output: 10 },
  'gpt-4o-2024-08-06':             { input: 2.5,   output: 10 },
  'gpt-4o-2024-05-13':             { input: 5,     output: 15 },
  'gpt-4o-mini':                   { input: 0.15,  output: 0.6 },
  'gpt-4o-mini-2024-07-18':        { input: 0.15,  output: 0.6 },
  'gpt-4-turbo':                   { input: 10,    output: 30 },
  'gpt-4-turbo-preview':           { input: 10,    output: 30 },
  'gpt-4':                         { input: 30,    output: 60 },
  'gpt-4-32k':                     { input: 60,    output: 120 },
  'gpt-3.5-turbo':                 { input: 0.5,   output: 1.5 },
  'gpt-3.5-turbo-16k':             { input: 3,     output: 4 },
  'o1':                            { input: 15,    output: 60 },
  'o1-2024-12-17':                 { input: 15,    output: 60 },
  'o1-mini':                       { input: 1.1,   output: 4.4 },
  'o1-preview':                    { input: 15,    output: 60 },
  'o3':                            { input: 10,    output: 40 },
  'o3-mini':                       { input: 1.1,   output: 4.4 },
  'o4-mini':                       { input: 1.1,   output: 4.4 },

  // ── Anthropic Claude ────────────────────────────────────
  'claude-opus-4-5':               { input: 15,    output: 75 },
  'claude-sonnet-4-5':             { input: 3,     output: 15 },
  'claude-3-5-sonnet-20241022':    { input: 3,     output: 15 },
  'claude-3-5-sonnet-20240620':    { input: 3,     output: 15 },
  'claude-3-5-sonnet-latest':      { input: 3,     output: 15 },
  'claude-3-5-haiku-20241022':     { input: 0.8,   output: 4 },
  'claude-3-5-haiku-latest':       { input: 0.8,   output: 4 },
  'claude-3-opus-20240229':        { input: 15,    output: 75 },
  'claude-3-opus-latest':          { input: 15,    output: 75 },
  'claude-3-sonnet-20240229':      { input: 3,     output: 15 },
  'claude-3-haiku-20240307':       { input: 0.25,  output: 1.25 },

  // ── Google Gemini ────────────────────────────────────────
  'gemini-2.5-pro':                { input: 1.25,  output: 10 },
  'gemini-2.5-flash':              { input: 0.15,  output: 0.6 },
  'gemini-2.0-flash':              { input: 0,     output: 0,   note: '免费' },
  'gemini-2.0-flash-exp':          { input: 0,     output: 0,   note: '免费' },
  'gemini-1.5-pro':                { input: 1.25,  output: 5 },
  'gemini-1.5-pro-002':            { input: 1.25,  output: 5 },
  'gemini-1.5-flash':              { input: 0.075, output: 0.3 },
  'gemini-1.5-flash-002':          { input: 0.075, output: 0.3 },
  'gemini-1.5-flash-8b':           { input: 0.0375,output: 0.15 },

  // ── Meta Llama ───────────────────────────────────────────
  'llama-3.3-70b-instruct':        { input: 0.2,   output: 0.2 },
  'llama-3.1-405b-instruct':       { input: 3,     output: 3 },
  'llama-3.1-70b-instruct':        { input: 0.52,  output: 0.75 },
  'llama-3.1-8b-instruct':         { input: 0.18,  output: 0.18 },

  // ── Mistral ──────────────────────────────────────────────
  'mistral-large-latest':          { input: 2,     output: 6 },
  'mistral-medium-latest':         { input: 0.4,   output: 2 },
  'mistral-small-latest':          { input: 0.1,   output: 0.3 },
  'mixtral-8x22b-instruct':        { input: 2,     output: 6 },
  'mixtral-8x7b-instruct':         { input: 0.7,   output: 0.7 },

  // ── DeepSeek ─────────────────────────────────────────────
  'deepseek-chat':                 { input: 0.27,  output: 1.1 },
  'deepseek-reasoner':             { input: 0.55,  output: 2.19 },
  'deepseek-v3':                   { input: 0.27,  output: 1.1 },
  'deepseek-r1':                   { input: 0.55,  output: 2.19 },

  // ── Qwen (Alibaba) ───────────────────────────────────────
  'qwen-max':                      { input: 0.04,  output: 0.12 },
  'qwen-plus':                     { input: 0.0008,output: 0.002 },
  'qwen-turbo':                    { input: 0.0002,output: 0.0006 },
  'qwen2.5-72b-instruct':          { input: 0.004, output: 0.012 },
  'qwen2.5-7b-instruct':           { input: 0.001, output: 0.001 },

  // ── Moonshot (Kimi) ──────────────────────────────────────
  'moonshot-v1-8k':                { input: 0.012, output: 0.012, note: 'CNY' },
  'moonshot-v1-32k':               { input: 0.024, output: 0.024, note: 'CNY' },
  'moonshot-v1-128k':              { input: 0.06,  output: 0.06,  note: 'CNY' },

  // ── 智谱 GLM ────────────────────────────────────────────
  'glm-4':                         { input: 0.1,   output: 0.1,   note: 'CNY' },
  'glm-4-flash':                   { input: 0,     output: 0,     note: '免费' },
  'glm-4-air':                     { input: 0.001, output: 0.001, note: 'CNY' },
  'glm-4-airx':                    { input: 0.01,  output: 0.01,  note: 'CNY' },
  'glm-3-turbo':                   { input: 0.001, output: 0.001, note: 'CNY' },

  // ── 百川 Baichuan ────────────────────────────────────────
  'Baichuan4':                     { input: 0.1,   output: 0.1,   note: 'CNY' },
  'Baichuan3-Turbo':               { input: 0.012, output: 0.012, note: 'CNY' },

  // ── 讯飞星火 ─────────────────────────────────────────────
  'spark-ultra':                   { input: 0.02,  output: 0.02,  note: 'CNY' },
  'spark-pro':                     { input: 0.008, output: 0.008, note: 'CNY' },

  // ── 文心 ERNIE ───────────────────────────────────────────
  'ernie-4.0-8k':                  { input: 0.12,  output: 0.12,  note: 'CNY' },
  'ernie-3.5-8k':                  { input: 0.012, output: 0.036, note: 'CNY' },
};

export function getOfficialPrice(modelId: string): OfficialPrice | null {
  if (OFFICIAL_PRICES[modelId]) return OFFICIAL_PRICES[modelId];
  // Strip date suffixes for fuzzy match: gpt-4o-2024-11-20 → gpt-4o
  const base = modelId.replace(/-\d{4}-\d{2}-\d{2}$/, '').replace(/-latest$/, '');
  if (base !== modelId && OFFICIAL_PRICES[base]) return OFFICIAL_PRICES[base];
  return null;
}
