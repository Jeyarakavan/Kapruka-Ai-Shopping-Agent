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

  return {
    ...existing,
    budget: budget ?? existing.budget,
    recipientAge: recipientAge ?? existing.recipientAge,
    relationship: relationship ?? existing.relationship,
    recipientGender: recipientGender ?? existing.recipientGender,
    yearsTogether: yearsTogether ?? existing.yearsTogether,
    interests: interests ?? existing.interests,
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

export function buildGiftSearchQuery(ctx = {}) {
  const parts = ['gift'];
  if (ctx.relationship === 'girlfriend') parts.push('girlfriend romantic');
  else if (ctx.relationship === 'boyfriend') parts.push('boyfriend');
  else if (ctx.recipientGender === 'female') parts.push('her women');
  else if (ctx.recipientGender === 'male') parts.push('him men');

  if (ctx.interests) parts.push(ctx.interests);
  if (ctx.occasion && ctx.occasion !== 'general') parts.push(ctx.occasion);

  return parts.join(' ').trim();
}
