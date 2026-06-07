/**
 * Reliable regex-based shopping intent extraction (supplements LLM parsing).
 */

export function extractPriceRange(message) {
  const text = message.replace(/,/g, '');
  const between = text.match(/(?:between|from)\s*(\d+)\s*(?:to|and|-)\s*(\d+)/i);
  if (between) return { minPrice: +between[1], maxPrice: +between[2] };

  const range = text.match(/(\d+)\s*(?:to|-|and)\s*(\d+)/i);
  if (range) return { minPrice: +range[1], maxPrice: +range[2] };

  const under = text.match(/(?:under|below|less than|max)\s*(?:lkr\s*)?(\d+)/i);
  if (under) return { maxPrice: +under[1] };

  const above = text.match(/(?:above|over|more than|min)\s*(?:lkr\s*)?(\d+)/i);
  if (above) return { minPrice: +above[1] };

  return {};
}

export function extractKeyword(message) {
  const lower = message.toLowerCase();

  const categories = [
    'watch', 'watches', 'makeup', 'pen', 'pens', 'cake', 'flowers', 'chocolate',
    'phone', 'laptop', 'gift', 'jewellery', 'jewelry', 'perfume', 'shoes', 'bag',
  ];

  for (const cat of categories) {
    if (lower.includes(cat)) return cat === 'watches' ? 'watch' : cat;
  }

  const needMatch = lower.match(/(?:need|want|find|show|suggest|search|buy)\s+(?:a|an|some|me)?\s*([a-z][a-z\s]{2,30})/i);
  if (needMatch) {
    const word = needMatch[1].trim().split(/\s+/)[0];
    if (word.length > 2 && !['the', 'some', 'this', 'that'].includes(word)) return word;
  }

  return '';
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
