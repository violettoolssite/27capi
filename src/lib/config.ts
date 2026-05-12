import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json');

export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  siteKeyword: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  announcement: string;
  customCss: string;
  adminPassword: string;
  upstream: {
    baseUrl: string;
    apiKey: string;
    timeout: number;
  };
  access: {
    requireRelayKey: boolean;
    relayKey: string;
  };
  billing: {
    enabled: boolean;
    deductionPerRequest: number;
    currency: string;
  };
  registration: {
    enabled: boolean;
    defaultBalance: number;
  };
  contact: {
    email: string;
    wechat: string;
    telegram: string;
    qq: string;
  };
  legal: {
    icp: string;
    copyright: string;
  };
  pricing: {
    showPage: boolean;
    defaultInputPer1M: number;
    defaultOutputPer1M: number;
    note: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromName: string;
    fromEmail: string;
  };
  emailVerification: {
    enabled: boolean;
    whitelist: string[];
  };
}

export const DEFAULT_CONFIG: SiteConfig = {
  siteName: '27c API',
  siteDescription: '高速稳定的 OpenAI 兼容 API 中转服务',
  siteKeyword: 'API中转, OpenAI, Claude, AI接口',
  logoUrl: null,
  faviconUrl: null,
  announcement: '',
  customCss: '',
  adminPassword: '123456',
  upstream: {
    baseUrl: '',
    apiKey: '',
    timeout: 60000,
  },
  access: {
    requireRelayKey: false,
    relayKey: '',
  },
  billing: {
    enabled: false,
    deductionPerRequest: 0.001,
    currency: '¥',
  },
  registration: {
    enabled: true,
    defaultBalance: 1.0,
  },
  contact: {
    email: '',
    wechat: '',
    telegram: '',
    qq: '',
  },
  legal: {
    icp: '',
    copyright: '',
  },
  pricing: {
    showPage: true,
    defaultInputPer1M: 0,
    defaultOutputPer1M: 0,
    note: '',
  },
  smtp: {
    host: '',
    port: 587,
    user: '',
    pass: '',
    fromName: '',
    fromEmail: '',
  },
  emailVerification: {
    enabled: false,
    whitelist: [],
  },
};

let _cache: SiteConfig | null = null;
let _cacheTime = 0;
const CACHE_TTL = 5000;

export async function getConfig(): Promise<SiteConfig> {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL) return _cache;

  let base: SiteConfig;
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    base = deepMerge(DEFAULT_CONFIG, JSON.parse(raw)) as SiteConfig;
  } catch {
    base = { ...DEFAULT_CONFIG };
  }

  // Environment variable overrides (highest priority)
  if (process.env.ADMIN_PASSWORD_OVERRIDE) base.adminPassword = process.env.ADMIN_PASSWORD_OVERRIDE;
  if (process.env.UPSTREAM_BASE_URL) base.upstream.baseUrl = process.env.UPSTREAM_BASE_URL;
  if (process.env.UPSTREAM_API_KEY) base.upstream.apiKey = process.env.UPSTREAM_API_KEY;
  if (process.env.UPSTREAM_TIMEOUT_MS) base.upstream.timeout = parseInt(process.env.UPSTREAM_TIMEOUT_MS);
  if (process.env.SMTP_HOST) base.smtp.host = process.env.SMTP_HOST;
  if (process.env.SMTP_PORT) base.smtp.port = parseInt(process.env.SMTP_PORT);
  if (process.env.SMTP_USER) base.smtp.user = process.env.SMTP_USER;
  if (process.env.SMTP_PASS) base.smtp.pass = process.env.SMTP_PASS;
  if (process.env.SMTP_FROM_NAME) base.smtp.fromName = process.env.SMTP_FROM_NAME;
  if (process.env.SMTP_FROM_EMAIL) base.smtp.fromEmail = process.env.SMTP_FROM_EMAIL;

  _cache = base;
  _cacheTime = now;
  return _cache;
}

export async function saveConfig(updates: Partial<SiteConfig>): Promise<void> {
  const current = await getConfig();
  const next = deepMerge(current, updates) as SiteConfig;
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf-8');
  _cache = next;
  _cacheTime = Date.now();
}

export function getSafeConfig(config: SiteConfig): Omit<SiteConfig, 'adminPassword' | 'upstream'> & {
  upstream: { baseUrl: string; timeout: number; configured: boolean };
} {
  const { adminPassword: _ap, upstream, ...rest } = config;
  return {
    ...rest,
    upstream: {
      baseUrl: upstream.baseUrl,
      timeout: upstream.timeout,
      configured: !!(upstream.baseUrl && upstream.apiKey),
    },
  };
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (
    typeof base !== 'object' || base === null ||
    typeof override !== 'object' || override === null
  ) {
    return override !== undefined ? override : base;
  }
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override as Record<string, unknown>)) {
    const bv = (base as Record<string, unknown>)[key];
    const ov = (override as Record<string, unknown>)[key];
    result[key] = deepMerge(bv, ov);
  }
  return result;
}
