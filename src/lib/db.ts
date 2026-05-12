import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}

export interface User {
  id: string;
  username: string;
  email: string | null;
  passwordHash: string;
  role: 'admin' | 'user';
  balance: number;
  status: 'active' | 'suspended';
  emailVerified: boolean;
  verificationToken: string | null;
  verificationExpires: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface ApiKey {
  id: string;
  userId: string;
  keyPrefix: string;
  keyHash: string;
  name: string;
  status: 'active' | 'disabled';
  usageCount: number;
  createdAt: number;
  lastUsedAt: number | null;
  expiresAt: number | null;
}

export interface UsageLog {
  id: string;
  userId: string;
  apiKeyId: string | null;
  model: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  requestPath: string | null;
  statusCode: number | null;
  createdAt: number;
}

class FileStore<T extends { id: string }> {
  private file: string;
  private cache: T[] | null = null;

  constructor(filename: string) {
    this.file = path.join(DATA_DIR, filename);
  }

  load(): T[] {
    if (this.cache !== null) return this.cache;
    try {
      this.cache = JSON.parse(fs.readFileSync(this.file, 'utf-8')) as T[];
    } catch {
      this.cache = [];
    }
    return this.cache;
  }

  private save(): void {
    fs.writeFileSync(this.file, JSON.stringify(this.cache, null, 2), 'utf-8');
  }

  findById(id: string): T | undefined {
    return this.load().find(r => r.id === id);
  }

  findOne(pred: (r: T) => boolean): T | undefined {
    return this.load().find(pred);
  }

  filter(pred: (r: T) => boolean): T[] {
    return this.load().filter(pred);
  }

  all(): T[] {
    return this.load();
  }

  insert(data: Omit<T, 'id'>): T {
    const record = { ...data, id: randomUUID() } as T;
    this.load().push(record);
    this.save();
    return record;
  }

  updateById(id: string, updates: Partial<Omit<T, 'id'>>): T | null {
    const items = this.load();
    const i = items.findIndex(r => r.id === id);
    if (i === -1) return null;
    items[i] = { ...items[i], ...updates };
    this.save();
    return items[i];
  }

  deleteById(id: string): boolean {
    const items = this.load();
    const i = items.findIndex(r => r.id === id);
    if (i === -1) return false;
    items.splice(i, 1);
    this.save();
    return true;
  }
}

const usersStore = new FileStore<User>('users.json');
const keysStore = new FileStore<ApiKey>('api_keys.json');
const LOGS_FILE = path.join(DATA_DIR, 'usage_logs.jsonl');

export const userDb = {
  findById: (id: string) => usersStore.findById(id) ?? null,
  findByUsername: (u: string) =>
    usersStore.findOne(r => r.username.toLowerCase() === u.toLowerCase()) ?? null,
  findByEmail: (e: string) =>
    usersStore.findOne(r => r.email?.toLowerCase() === e.toLowerCase()) ?? null,
  findByVerificationToken: (token: string) =>
    usersStore.findOne(r => r.verificationToken === token) ?? null,
  all: () => usersStore.all(),
  count: () => usersStore.all().length,

  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'emailVerified' | 'verificationToken' | 'verificationExpires'> & { emailVerified?: boolean; verificationToken?: string | null; verificationExpires?: number | null }): User {
    const now = Date.now();
    return usersStore.insert({
      emailVerified: true,
      verificationToken: null,
      verificationExpires: null,
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  },

  update(id: string, data: Partial<Omit<User, 'id'>>): User | null {
    return usersStore.updateById(id, { ...data, updatedAt: Date.now() });
  },

  delete(id: string): boolean {
    keysStore.filter(k => k.userId === id).forEach(k => keysStore.deleteById(k.id));
    return usersStore.deleteById(id);
  },

  deductBalance(id: string, amount: number): boolean {
    const u = usersStore.findById(id);
    if (!u || u.balance < amount) return false;
    usersStore.updateById(id, { balance: +(u.balance - amount).toFixed(8), updatedAt: Date.now() });
    return true;
  },

  addBalance(id: string, amount: number): void {
    const u = usersStore.findById(id);
    if (!u) return;
    usersStore.updateById(id, { balance: +(u.balance + amount).toFixed(8), updatedAt: Date.now() });
  },
};

export const apiKeyDb = {
  findByHash: (hash: string) => keysStore.findOne(k => k.keyHash === hash) ?? null,
  findById: (id: string) => keysStore.findById(id) ?? null,
  listForUser: (userId: string) => keysStore.filter(k => k.userId === userId),

  create(data: Omit<ApiKey, 'id' | 'usageCount' | 'createdAt' | 'lastUsedAt'>): ApiKey {
    return keysStore.insert({ ...data, usageCount: 0, createdAt: Date.now(), lastUsedAt: null });
  },

  update: (id: string, data: Partial<Omit<ApiKey, 'id'>>) => keysStore.updateById(id, data),

  delete(id: string, userId: string): boolean {
    const k = keysStore.findById(id);
    if (!k || k.userId !== userId) return false;
    return keysStore.deleteById(id);
  },

  incrementUsage(id: string): void {
    const k = keysStore.findById(id);
    if (!k) return;
    keysStore.updateById(id, { usageCount: k.usageCount + 1, lastUsedAt: Date.now() });
  },
};

export function appendUsageLog(log: Omit<UsageLog, 'id'>): void {
  try {
    const record: UsageLog = { ...log, id: randomUUID() };
    fs.appendFileSync(LOGS_FILE, JSON.stringify(record) + '\n', 'utf-8');
  } catch {}
}

export function readUsageLogs(opts: { userId?: string; limit?: number; offset?: number } = {}): {
  logs: UsageLog[];
  total: number;
} {
  const { userId, limit = 50, offset = 0 } = opts;
  try {
    const lines = fs
      .readFileSync(LOGS_FILE, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .reverse();
    let all = lines.map(l => JSON.parse(l) as UsageLog);
    if (userId) all = all.filter(l => l.userId === userId);
    return { logs: all.slice(offset, offset + limit), total: all.length };
  } catch {
    return { logs: [], total: 0 };
  }
}

export function getGlobalStats(): {
  totalUsers: number;
  totalKeys: number;
  totalRequests: number;
  totalCost: number;
} {
  const { logs, total } = readUsageLogs();
  const totalCost = logs.reduce((s, l) => s + l.cost, 0);
  return {
    totalUsers: userDb.count(),
    totalKeys: keysStore.all().length,
    totalRequests: total,
    totalCost: +totalCost.toFixed(6),
  };
}
