const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const cache = new Map();

function getCacheKey(tool, params) {
  return `${tool}:${JSON.stringify(params)}`;
}

export function getFromCache(tool, params) {
  const key = getCacheKey(tool, params);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(tool, params, data) {
  const key = getCacheKey(tool, params);
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache() {
  cache.clear();
}
