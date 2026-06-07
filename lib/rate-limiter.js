/**
 * Rate Limiter — Token Bucket algorithm
 * 60 req/min per IP for MCP, 30 order creations/hr per IP
 */

class TokenBucket {
  constructor({ capacity, refillRate, refillInterval }) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.refillInterval = refillInterval;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor((elapsed / this.refillInterval) * this.refillRate);
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  consume(count = 1) {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  getWaitTime(count = 1) {
    this.refill();
    if (this.tokens >= count) return 0;
    const needed = count - this.tokens;
    return Math.ceil((needed / this.refillRate) * this.refillInterval);
  }
}

// Global buckets (server-side singleton)
const mcpBucket = new TokenBucket({
  capacity: 60,
  refillRate: 60,
  refillInterval: 60_000, // 1 minute
});

const orderBucket = new TokenBucket({
  capacity: 30,
  refillRate: 30,
  refillInterval: 3_600_000, // 1 hour
});

const chatBucket = new TokenBucket({
  capacity: 60,
  refillRate: 60,
  refillInterval: 60_000, // 1 minute
});

// Request deduplication
const pendingRequests = new Map();

/**
 * Check if a chat API request is allowed (Chat Limiter)
 */
export function canMakeChatRequest() {
  return chatBucket.consume(1);
}

export function getChatWaitTime() {
  return chatBucket.getWaitTime(1);
}

/**
 * Check if a general MCP request is allowed
 */
export function canMakeMCPRequest() {
  return mcpBucket.consume(1);
}

export function getMCPWaitTime() {
  return mcpBucket.getWaitTime(1);
}

/**
 * Check if an order creation is allowed
 */
export function canCreateOrder() {
  // Consumes from both order bucket and mcp bucket
  if (!orderBucket.consume(1)) return false;
  return mcpBucket.consume(1);
}

/**
 * Exponential backoff retry wrapper
 */
export async function withRetry(fn, { maxAttempts = 3, baseDelay = 1000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Check MCP rate limit wait time
      const waitTime = mcpBucket.getWaitTime(1);
      if (waitTime > 0) {
        await sleep(waitTime);
      }
      if (!mcpBucket.consume(1)) {
        throw new Error('Rate limit exceeded. Please wait a moment.');
      }
      return await fn();
    } catch (err) {
      lastError = err;
      if (err.message?.includes('Rate limit') || err.status === 429) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Rate limited. Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      // Non-rate-limit errors retry too but faster
      if (attempt < maxAttempts - 1) {
        await sleep(baseDelay * (attempt + 1));
      }
    }
  }
  throw lastError;
}

/**
 * Deduplicate concurrent identical requests
 */
export async function deduplicateRequest(key, fn) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  const promise = fn().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
