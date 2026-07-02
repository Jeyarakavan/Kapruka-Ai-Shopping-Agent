/**
 * Gift Agent
 * Handles: birthday, anniversary, wedding, graduation, newborn, corporate gifting
 */

import { searchProducts } from '../services/product-service.js';
import { enrichProductsWithDetails } from '../services/product-enrichment.js';
import { normalizeProductList } from '../mcp/product-parser.js';
import { filterProductsByPrice, extractBudgetFallback } from '../shopping/intent-parser.js';

import {
  extractGiftContextFromConversation,
  isShowProductsRequest,
  isProductDetailRequest,
  hasEnoughGiftContext,
  buildGiftSearchQuery,
  SPECIFIC_ITEM_SEARCH_MAP,
  filterByRelevance,
} from '../shopping/gift-context.js';

import { fetchProductDetail, buildProductDetailResponse } from '../shopping/product-detail.js';
import { generateChatResponse } from '../llm/groq-client.js';

const SYSTEM_INSTRUCTION = `You are the Kapruka Gift Genie — a warm gifting specialist for Sri Lanka.
Product cards with photos appear below your message — keep text brief.
Only mention products from the provided Kapruka data. Never invent product names.
Format prices in LKR.`;

const GIFT_OCCASIONS = {
  birthday: ['birthday', 'bday', 'born'],
  anniversary: ['anniversary', 'years together'],
  wedding: ['wedding', 'marriage', 'bride', 'groom'],
  graduation: ['graduation', 'graduate', 'degree'],
  newborn: ['baby', 'newborn', 'infant'],
  corporate: ['corporate', 'office', 'colleague', 'boss'],
  valentines: ['valentine', 'love', 'romantic'],
  poya: ['vesak', 'poya', 'poson'],
};

function detectOccasion(message, ctx = {}) {
  const lower = message.toLowerCase();
  for (const [occasion, keywords] of Object.entries(GIFT_OCCASIONS)) {
    if (keywords.some((kw) => lower.includes(kw))) return occasion;
  }
  if (ctx.relationship === 'girlfriend' || ctx.relationship === 'boyfriend') return 'romantic';
  return ctx.occasion || 'general';
}

async function searchGiftProducts(ctx, occasion) {
  let searches;

  if (ctx.specificItem) {
    // Use precise search map to avoid junk results (e.g. "flower" → "rose bouquet")
    const mapped = SPECIFIC_ITEM_SEARCH_MAP[ctx.specificItem];
    if (mapped?.length) {
      searches = mapped; // e.g. ['rose bouquet', 'fresh flowers', 'lily flowers']
    } else {
      const keyword = buildGiftSearchQuery({ ...ctx, occasion });
      searches = [keyword, `${ctx.specificItem} gift`, ctx.specificItem];
    }
  } else {
    const keyword = buildGiftSearchQuery({ ...ctx, occasion });
    searches = [keyword, 'flowers gift', 'chocolate gift', 'jewellery gift'];
  }

  let allProducts = [];

  for (const q of [...new Set(searches)].slice(0, 3)) {
    try {
      const result = await searchProducts({
        keyword: q,
        maxPrice: ctx.budget,
        limit: 8,
      });
      const parsed = normalizeProductList(result) || [];
      allProducts.push(...parsed);
    } catch {
      // continue with other searches
    }
  }

  // Deduplicate
  const seen = new Set();
  allProducts = allProducts.filter((p) => {
    const id = (p.id || p.product_id || '').toUpperCase();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  // Filter by relevance — discard results that don't match the item type
  if (ctx.specificItem) {
    const filtered = filterByRelevance(allProducts, ctx.specificItem);
    // Only use the filtered list if it has results; otherwise fall back to all
    if (filtered.length > 0) allProducts = filtered;
  }

  if (ctx.budget) {
    allProducts = filterProductsByPrice(allProducts, null, ctx.budget);
  }

  return allProducts.slice(0, 6);
}



export async function runGiftAgent(userMessage, conversationHistory = [], sessionContext = {}) {
  const giftContext = sessionContext.giftContext || {};
  const mergedContext = extractGiftContextFromConversation(
    conversationHistory,
    userMessage,
    giftContext
  );

  // Apply budget typo fallback if context extraction didn't find a budget
  if (!mergedContext.budget) {
    const budgetFallback = extractBudgetFallback(userMessage);
    if (budgetFallback) mergedContext.budget = budgetFallback;
  }

  const occasion = detectOccasion(userMessage, mergedContext);
  mergedContext.occasion = occasion;


  // ── Single product detail (View Details) — MCP only, one card ──
  if (isProductDetailRequest(userMessage) || sessionContext.selectedProduct) {
    const productRef = sessionContext.selectedProduct || { message: userMessage };
    try {
      const product = await fetchProductDetail(productRef, sessionContext);
      if (!product) {
        return {
          text: `I couldn't load that product from Kapruka. Please tap **View Details** on a product card again.`,
          products: null,
          giftContext: mergedContext,
        };
      }
      const detail = await buildProductDetailResponse(product, userMessage, conversationHistory);
      return {
        ...detail,
        occasion,
        giftContext: mergedContext,
      };
    } catch (err) {
      console.error('[GiftAgent] Detail error:', err.message);
      return {
        text: `Sorry, I couldn't load that product's details from Kapruka right now. Please try again.`,
        products: null,
        giftContext: mergedContext,
        error: err.message,
      };
    }
  }

  // If the user named a specific product, skip the info-gathering gate
  const hasSpecificRequest = !!mergedContext.specificItem;

  const wantsProducts =
    hasSpecificRequest ||
    isShowProductsRequest(userMessage) ||
    hasEnoughGiftContext(mergedContext);

  if (!wantsProducts || (!hasEnoughGiftContext(mergedContext) && !hasSpecificRequest)) {
    const questions = await generateChatResponse(
      `User wants gift ideas: "${userMessage}"
Known context: ${JSON.stringify(mergedContext)}

Ask 1-2 warm questions ONLY for what's still missing (budget in LKR, recipient age, delivery city).
Keep it short.`,
      { model: 'fast', systemInstruction: SYSTEM_INSTRUCTION }
    );

    return {
      text: questions,
      products: null,
      occasion,
      giftContext: mergedContext,
      needsMoreInfo: true,
    };
  }

  let productList = [];
  try {
    productList = await searchGiftProducts(mergedContext, occasion);
    if (productList.length) {
      productList = await enrichProductsWithDetails(productList, productList.length);
    }
  } catch (err) {
    console.error('[GiftAgent] MCP error:', err.message);
    return {
      text: `I'm having trouble loading gifts from Kapruka right now. Please try again! 🎁`,
      products: null,
      giftContext: mergedContext,
      error: err.message,
    };
  }

  if (!productList.length) {
    return {
      text: `I couldn't find gifts within LKR ${mergedContext.budget?.toLocaleString('en-LK') || 'your budget'} on Kapruka. Try flowers, chocolates, or jewellery? 🎁`,
      products: null,
      giftContext: mergedContext,
    };
  }

  const response = await generateChatResponse(
    `Found ${productList.length} real Kapruka gifts (cards with photos below).
Products from Kapruka MCP: ${JSON.stringify(productList.map((p) => ({ id: p.id, title: p.title, price: p.price })))}

Write 2 short sentences intro only. Do NOT list products in bullet points — they appear as cards below.
Do NOT invent names — use only the list above.`,
    { model: 'main', systemInstruction: SYSTEM_INSTRUCTION, history: conversationHistory }
  ).catch((err) => {
    console.error('[GiftAgent] LLM summary error:', err.message);
    return `Here are ${productList.length} gift ideas from Kapruka within your LKR ${mergedContext.budget?.toLocaleString('en-LK') || 'budget'}. Tap **View Details** on any card for photos and full info.`;
  });

  return {
    text: response,
    products: productList,
    occasion,
    giftContext: mergedContext,
    lastProducts: productList,
    needsMoreInfo: false,
  };
}
