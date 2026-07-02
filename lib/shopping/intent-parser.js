/**
 * Reliable regex-based shopping intent extraction (supplements LLM parsing).
 */

export function extractPriceRange(message) {
  const text = message.replace(/,/g, '');
  const between = text.match(/(?:between|from)\s*(\d+)\s*(?:to|and|-)\s*(\d+)/i);
  if (between) return { minPrice: +between[1], maxPrice: +between[2] };

  const range = text.match(/(\d+)\s*(?:to|-|and)\s*(\d+)/i);
  if (range) return { minPrice: +range[1], maxPrice: +range[2] };

  const under = text.match(/(?:under|below|less than|max|within)\s*(?:lkr\s*)?(\d+)/i);
  if (under) return { maxPrice: +under[1] };

  const above = text.match(/(?:above|over|more than|min)\s*(?:lkr\s*)?(\d+)/i);
  if (above) return { minPrice: +above[1] };

  return {};
}

/**
 * Handle budget typos like "bdujet 5000", "bdget 10000", "within 10000 bdujet"
 * Also handles patterns like "10000 budget", "budget of 10000"
 */
export function extractBudgetFallback(message) {
  const text = message.replace(/,/g, '');
  // Match typo budget words followed by a number
  const typoFirst = text.match(/(?:bdujet|bdget|bdjet|budgt|buget|bugdet)\s*(?:is|of|:)?\s*(?:lkr\s*)?(\d+)/i);
  if (typoFirst) return +typoFirst[1];

  // Match number followed by budget word (e.g. "10000 bdujet", "10000 budget")
  const numFirst = text.match(/(\d+)\s*(?:bdujet|bdget|bdjet|budgt|buget|bugdet|budget)/i);
  if (numFirst) return +numFirst[1];

  // "within X" pattern
  const within = text.match(/within\s*(?:lkr\s*)?(\d+)/i);
  if (within) return +within[1];

  // "budget of X" or "budget is X"
  const budgetOf = text.match(/budget\s*(?:of|is|:)\s*(?:lkr\s*)?(\d+)/i);
  if (budgetOf) return +budgetOf[1];

  // "X LKR budget" or "LKR X budget"
  const lkrBudget = text.match(/(?:lkr|rs\.?)\s*(\d+)\s*(?:budget|bdujet|bdget)/i);
  if (lkrBudget) return +lkrBudget[1];

  return null;
}

/**
 * Extract how many products the user wants to see.
 * e.g. "show me 10 products", "find 5 laptops", "give me 8 options"
 */
export function extractRequestedCount(message) {
  const text = message.toLowerCase();

  // "show me 10 products", "show 5", "find 8 options"
  const countMatch = text.match(
    /(?:show|find|get|give|list|display|fetch|search)\s*(?:me\s*)?(?:top\s*)?(\d{1,2})(?:\s*(?:products?|items?|results?|options?|gifts?))?/i
  );
  if (countMatch) {
    const n = parseInt(countMatch[1], 10);
    if (n >= 1 && n <= 20) return n;
  }

  // "top 10", "best 5"
  const topMatch = text.match(/(?:top|best|first)\s*(\d{1,2})(?:\s*(?:products?|items?|results?|options?))?/i);
  if (topMatch) {
    const n = parseInt(topMatch[1], 10);
    if (n >= 1 && n <= 20) return n;
  }

  return null;
}


export function extractKeyword(message) {
  let q = message.toLowerCase().trim();

  // Remove count/quantity prefix (e.g. "show me 10", "find 5", "top 10")
  q = q.replace(/^(?:show me|show|find me|find|get me|get|give me|give|list|display|fetch|search for|search)\s+(?:top\s*|best\s*)?\d{1,2}\s*/i, '');
  q = q.replace(/^(?:top|best|first)\s*\d{1,2}\s*/i, '');

  // Remove common question/request starters
  q = q.replace(/^(?:i want to buy|i want|please show me|show me|find me|search for|search|buy|suggest|get|need|want|find|give me|look for)\s+/i, '');
  // Remove articles
  q = q.replace(/^(?:a|an|the|some|any|me)\s+/i, '');
  // Remove price suffixes (e.g. "under 5000", "below 5000", "between ...")
  q = q.replace(/\s*(?:under|below|less than|max|within|above|over|more than|min|between|from)\s*(?:lkr\s*)?\d+/gi, '');
  q = q.replace(/\s*(?:lkr|rs\.?)\s*\d+/gi, '');
  q = q.replace(/\s*\d+\s*(?:lkr|rs\.?)/gi, '');
  q = q.replace(/\s*to\s*\d+/gi, '');
  q = q.replace(/\s*and\s*\d+/gi, '');
  // Remove budget typo words and associated numbers
  q = q.replace(/\s*\d+\s*(?:bdujet|bdget|bdjet|budgt|buget|bugdet|budget)/gi, '');
  q = q.replace(/\s*(?:bdujet|bdget|bdjet|budgt|buget|bugdet|budget)\s*\d*/gi, '');

  // Remove relationship/gifting suffixes to keep search focused
  q = q.replace(/\s*(?:for my|for a|for)\s+(?:girlfriend|boyfriend|wife|husband|mom|dad|mother|father|brother|sister|friend|kids?|child|colleague|boss)/gi, '');

  // Clean punctuation and double spaces
  q = q.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").replace(/\s{2,}/g, " ").trim();

  // Normalize plural watches to watch
  if (q === 'watches') q = 'watch';

  return q;
}


export function extractQuotedName(message) {
  const quoted = message.match(/"([^"]{3,})"/)?.[1];
  if (quoted) return quoted.trim();
  return null;
}

export function detectShoppingAction(message, sessionContext = {}) {
  const lower = message.toLowerCase();

  if (/i want to buy|help me checkout|start checkout|place order|buy this/i.test(lower)) {
    return 'checkout';
  }

  // Browsing product cards — NOT a single-product detail lookup
  if (
    /show.*(card|cards|product|gift|option)|product cards|with photos|see the (products|gifts)/i.test(
      lower
    )
  ) {
    return 'search';
  }

  if (
    (/show.*(detail|photo|pic|image)|tell me more|more about|details of/i.test(lower) &&
      !/cards|products|gifts|options/i.test(lower)) ||
    (extractQuotedName(message) && /detail|photo|pic|show|about/i.test(lower))
  ) {
    return 'get_detail';
  }

  if (
    sessionContext.lastProducts?.length &&
    /this|that|it|those|the one/i.test(lower) &&
    !/cards|products|gifts|all/i.test(lower)
  ) {
    return 'get_detail';
  }

  return 'search';
}

export function findBestProductMatch(products, query) {
  if (!products?.length || !query) return products?.[0] || null;

  const q = query.toLowerCase().trim();

  const exact = products.find((p) => (p.title || p.name || '').toLowerCase() === q);
  if (exact) return exact;

  const contains = products.find((p) => (p.title || p.name || '').toLowerCase().includes(q));
  if (contains) return contains;

  const reverse = products.find((p) => q.includes((p.title || p.name || '').toLowerCase().slice(0, 20)));
  if (reverse) return reverse;

  const qWords = q.split(/\s+/).filter((w) => w.length > 3);
  let best = products[0];
  let bestScore = 0;

  for (const p of products) {
    const title = (p.title || p.name || '').toLowerCase();
    const score = qWords.filter((w) => title.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  return best;
}

export function filterProductsByPrice(products, minPrice, maxPrice) {
  if (!products?.length) return products;
  return products.filter((p) => {
    const price = p.price || p.selling_price;
    if (!price) return true;
    if (minPrice != null && price < minPrice) return false;
    if (maxPrice != null && price > maxPrice) return false;
    return true;
  });
}
