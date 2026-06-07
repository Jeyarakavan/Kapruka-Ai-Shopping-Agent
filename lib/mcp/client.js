import { rawCallTool } from './transport.js';
import { getFromCache, setCache } from './cache.js';
import { withRetry, deduplicateRequest } from '../rate-limiter.js';

// Cacheable tools (read-only, stable data)
const CACHEABLE_TOOLS = new Set([
  'kapruka_list_categories',
  'kapruka_list_delivery_cities',
]);

// Product cache (short-term cacheable for up to 30 min)
const PRODUCT_CACHE_TOOLS = new Set([
  'kapruka_get_product',
  'kapruka_search_products',
]);

function getCacheKey(toolName, params) {
  return `${toolName}:${JSON.stringify(params)}`;
}

/**
 * Public client function that orchestrates caching, deduplication, retry, and rate limiting
 */
export async function executeTool(toolName, params = {}) {
  const isCacheable = CACHEABLE_TOOLS.has(toolName) || PRODUCT_CACHE_TOOLS.has(toolName);
  
  if (isCacheable) {
    const cached = getFromCache(toolName, params);
    if (cached) {
      console.log(`[Cache HIT] ${toolName}`, params);
      return cached;
    }
  }

  const cacheKey = getCacheKey(toolName, params);

  return deduplicateRequest(cacheKey, async () => {
    const result = await withRetry(() => rawCallTool(toolName, params));

    if (isCacheable && result) {
      setCache(toolName, params, result);
    }

    return result;
  });
}
