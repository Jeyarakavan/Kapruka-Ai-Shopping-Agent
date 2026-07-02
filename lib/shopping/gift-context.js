/**
 * Extract and merge gift context from conversation history.
 */

export function extractBudget(text) {
  const combined = text.replace(/,/g, '');
  const patterns = [
    /(?:budget|bdujet|bdget|bdjet)\s*(?:is|:)?\s*(?:lkr\s*)?(\d+)/i,
    /(?:lkr|rs\.?)\s*(\d+)/i,
    /(\d{4,6})\s*(?:lkr|rs)/i,
    /\bbudget\s+(\d+)/i,
  ];
  for (const p of patterns) {
    const m = combined.match(p);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

// Products the user explicitly requests by name/type
const SPECIFIC_ITEMS = [
  'chocolate', 'chocolates', 'cake', 'cakes', 'flowers', 'flower', 'bouquet',
  'wine', 'champagne', 'perfume', 'cologne', 'watch', 'watches', 'ring', 'rings',
  'necklace', 'bracelet', 'earrings', 'jewellery', 'jewelry', 'teddy', 'teddy bear',
  'candle', 'candles', 'spa', 'hamper', 'basket', 'gift basket',
  'book', 'books', 'shirt', 'bag', 'wallet', 'handbag', 'shoes',
  'toy', 'toys', 'game', 'puzzle', 'skincare', 'makeup',
];

export function extractSpecificItem(message) {
  const lower = message.toLowerCase();
  // Check for phrases like "send her chocolates", "get some flowers", "I want a ring"
  for (const item of SPECIFIC_ITEMS) {
    // Match the item as a whole word
    const re = new RegExp(`\\b${item.replace(/s$/, 's?')}\\b`, 'i');
    if (re.test(lower)) return item.replace(/s$/, ''); // normalize to singular
  }
  return null;
}


export function extractAge(text) {
  const patterns = [
    /(?:age|aged)\s*(?:is|:)?\s*(\d{1,2})/i,
    /(?:she|he)\s+is\s+(\d{1,2})/i,
    /(\d{1,2})\s*(?:years?\s*old|yrs?)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return String(parseInt(m[1], 10));
  }
  return null;
}

export function extractGiftContextFromConversation(history = [], currentMessage = '', existing = {}) {
  const allText = [...history.map((h) => h.content || ''), currentMessage].join('\n');
  const lower = allText.toLowerCase();

  const budget = extractBudget(allText) ?? existing.budget;
  const recipientAge = extractAge(allText) ?? existing.recipientAge;

  let relationship = existing.relationship;
  if (/girl\s*friend|girlfriend|my girl/i.test(lower)) relationship = 'girlfriend';
  else if (/boy\s*friend|boyfriend|my boy/i.test(lower)) relationship = 'boyfriend';
  else if (/wife|husband|partner|fianc/i.test(lower)) relationship = 'partner';

  let recipientGender = existing.recipientGender;
  if (/girl\s*friend|girlfriend|\bshe\b|\bher\b|wife/i.test(lower)) recipientGender = 'female';
  else if (/boy\s*friend|boyfriend|\bhe\b|\bhis\b|husband/i.test(lower)) recipientGender = 'male';

  const yearsMatch = allText.match(/(\d+)\s*years?\s*together/i);
  const yearsTogether = yearsMatch ? yearsMatch[1] : existing.yearsTogether;

  let interests = existing.interests;
  if (/music|books|nature|fashion|tech|food|travel/i.test(lower)) {
    const found = ['music', 'books', 'nature', 'fashion', 'tech', 'food', 'travel'].find((i) =>
      lower.includes(i)
    );
    if (found) interests = found;
  }

  // Detect if user is asking for a specific product type
  const specificItem = extractSpecificItem(currentMessage) ?? existing.specificItem ?? null;

  return {
    ...existing,
    budget: budget ?? existing.budget,
    recipientAge: recipientAge ?? existing.recipientAge,
    relationship: relationship ?? existing.relationship,
    recipientGender: recipientGender ?? existing.recipientGender,
    yearsTogether: yearsTogether ?? existing.yearsTogether,
    interests: interests ?? existing.interests,
    specificItem,
    active: true,
  };
}


export function isShowProductsRequest(message) {
  if (isProductDetailRequest(message)) return false;

  const lower = message.toLowerCase();
  return (
    /show.*(card|photo|pic|product|gift|option)/i.test(lower) ||
    /product cards|with photos|see the (products|gifts|options)|cards with/i.test(lower) ||
    /show me (the )?(products|gifts|items)/i.test(lower) ||
    /suggest.*gift.*(card|photo)/i.test(lower)
  );
}

export function isProductDetailRequest(message) {
  const lower = message.toLowerCase();
  if (/view details|show details|details and photo|detail for|tell me more about|details for this product/i.test(lower)) {
    return true;
  }
  const quoted = message.match(/"([^"]{3,})"/)?.[1];
  if (quoted && /detail|photo|pic|about/i.test(lower)) return true;
  return false;
}

export function hasEnoughGiftContext(ctx = {}) {
  return !!(ctx.budget || ctx.recipientAge || ctx.relationship || ctx.recipientGender);
}

/**
 * Maps specific item types to precise Kapruka search terms.
 * This avoids junk matches like "banana flower" when searching for "flower".
 */
export const SPECIFIC_ITEM_SEARCH_MAP = {
  flower:     ['rose bouquet', 'fresh flowers', 'lily flowers'],
  chocolate:  ['chocolate gift box', 'premium chocolate', 'ferrero rocher'],
  cake:       ['birthday cake', 'fresh cake', 'celebration cake'],
  wine:       ['wine bottle gift', 'wine hamper', 'red wine'],
  champagne:  ['champagne bottle', 'sparkling wine'],
  perfume:    ['perfume women', 'perfume men', 'perfume gift set'],
  cologne:    ['cologne men', 'perfume men'],
  watch:      ['watch women', 'watch men', 'wrist watch'],
  ring:       ['gold ring', 'silver ring', 'diamond ring'],
  necklace:   ['necklace women', 'gold necklace', 'silver necklace'],
  bracelet:   ['bracelet women', 'gold bracelet', 'charm bracelet'],
  earring:    ['earrings women', 'gold earrings', 'silver earrings'],
  jewellery:  ['gold jewellery', 'silver jewellery', 'jewellery gift set'],
  teddy:      ['teddy bear', 'soft toy bear', 'plush teddy'],
  candle:     ['scented candle', 'candle gift set', 'aroma candle'],
  spa:        ['spa gift set', 'spa hamper', 'bath gift set'],
  hamper:     ['gift hamper', 'luxury hamper', 'pamper hamper'],
  basket:     ['gift basket', 'hamper basket', 'fruit basket'],
  book:       ['book gift', 'novel', 'books set'],
  shirt:      ['shirt men', 'shirt women', 'shirt gift'],
  bag:        ['handbag women', 'bag gift', 'tote bag'],
  wallet:     ['wallet men', 'leather wallet', 'wallet gift'],
  handbag:    ['handbag women', 'ladies bag', 'leather handbag'],
  toy:        ['toy gift', 'kids toy', 'educational toy'],
  skincare:   ['skincare gift set', 'face cream set', 'skin care'],
  makeup:     ['makeup gift set', 'cosmetics gift', 'lipstick gift'],
};

/**
 * Filter products to only those whose title contains at least one
 * of the expected keywords. Prevents junk results.
 */
export function filterByRelevance(products, specificItem) {
  if (!specificItem || !products?.length) return products;

  // Build the set of title keywords to match against
  const searchEntries = SPECIFIC_ITEM_SEARCH_MAP[specificItem] || [];
  const mustContain = [
    specificItem,
    ...searchEntries.flatMap((q) => q.split(' ')),
  ].map((w) => w.toLowerCase()).filter((w) => w.length > 2);

  // Remove very generic words that would cause false positives
  const stopWords = new Set(['gift', 'for', 'her', 'him', 'and', 'set', 'the', 'men', 'women']);
  const keywords = mustContain.filter((w) => !stopWords.has(w));
  if (!keywords.length) return products;

  return products.filter((p) => {
    const title = (p.title || p.name || '').toLowerCase();
    return keywords.some((kw) => title.includes(kw));
  });
}

export function buildGiftSearchQuery(ctx = {}) {
  // If user explicitly asked for a specific product, use the precise search map
  if (ctx.specificItem) {
    const mapped = SPECIFIC_ITEM_SEARCH_MAP[ctx.specificItem];
    if (mapped?.length) {
      // Return first mapped query as primary; caller can iterate the array
      return mapped[0];
    }
    // Fallback: use the item name directly
    const parts = [ctx.specificItem];
    if (ctx.relationship === 'girlfriend' || ctx.recipientGender === 'female') parts.push('women');
    else if (ctx.relationship === 'boyfriend' || ctx.recipientGender === 'male') parts.push('men');
    return parts.join(' ').trim();
  }

  const parts = ['gift'];
  if (ctx.relationship === 'girlfriend') parts.push('girlfriend romantic');
  else if (ctx.relationship === 'boyfriend') parts.push('boyfriend');
  else if (ctx.recipientGender === 'female') parts.push('her women');
  else if (ctx.recipientGender === 'male') parts.push('him men');

  if (ctx.interests) parts.push(ctx.interests);
  if (ctx.occasion && ctx.occasion !== 'general') parts.push(ctx.occasion);

  return parts.join(' ').trim();
}
