import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'model_prices.json');

export interface ModelPrice {
  modelId: string;
  inputPer1M: number;
  outputPer1M: number;
  perRequest: number;
  enabled: boolean;
  updatedAt: number;
}

let _cache: Record<string, ModelPrice> | null = null;
let _cacheTime = 0;
const TTL = 5000;

export function getAllModelPrices(): Record<string, ModelPrice> {
  const now = Date.now();
  if (_cache && now - _cacheTime < TTL) return _cache;
  try {
    _cache = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    _cacheTime = now;
    return _cache!;
  } catch {
    _cache = {};
    return {};
  }
}

export function setModelPrice(modelId: string, price: Omit<ModelPrice, 'modelId' | 'updatedAt'>): void {
  const all = getAllModelPrices();
  all[modelId] = { ...price, modelId, updatedAt: Date.now() };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2));
  _cache = all;
  _cacheTime = Date.now();
}

export function deleteModelPrice(modelId: string): void {
  const all = getAllModelPrices();
  delete all[modelId];
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2));
  _cache = all;
  _cacheTime = Date.now();
}

export function calculateCost(
  modelId: string | null,
  promptTokens: number,
  completionTokens: number,
  fallbackPerRequest: number
): number {
  if (!modelId) return fallbackPerRequest;
  const prices = getAllModelPrices();
  const p = prices[modelId];
  if (!p || !p.enabled) return fallbackPerRequest;
  return (
    (promptTokens / 1_000_000) * p.inputPer1M +
    (completionTokens / 1_000_000) * p.outputPer1M +
    p.perRequest
  );
}
