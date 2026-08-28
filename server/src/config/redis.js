import { config } from './env.js';

const cacheStore = new Map();

export const cacheGet = async (key) => {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return item.data;
};

export const cacheSet = async (key, data, ttlSeconds = 60) => {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
};

export const cacheFlush = async (pattern = '') => {
  if (!pattern) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
    }
  }
};
