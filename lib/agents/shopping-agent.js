/**
 * Shopping Agent
 * Handles: product search, recommendations, comparisons, budget shopping, category exploration
 */

import { searchProducts, listCategories } from '../services/product-service.js';
import { enrichProductsWithDetails } from '../services/product-enrichment.js';
import { normalizeProductList } from '../mcp/product-parser.js';
import {
  extractPriceRange,
  extractKeyword,
  detectShoppingAction,
  filterProductsByPrice,
  extractBudgetFallback,
  extractRequestedCount,
} from '../shopping/intent-parser.js';

import { fetchProductDetail, buildProductDetailResponse } from '../shopping/product-detail.js';
import { generateChatResponse } from '../llm/groq-client.js';

const SYSTEM_INSTRUCTION = `You are the Kapruka Shopping Agent — an expert Sri Lankan e-commerce assistant.
You help users find products on Kapruka.com. Format prices in LKR.
When products are shown as cards below your message, give a brief helpful summary — don't repeat every detail.
For product detail requests, describe features, price, stock, and why it's a good choice.`;

export async function runShoppingAgent(userMessage, conversationHistory = [], sessionContext = {}) {
  // ── Product comparison request ──
  const isCompareRequest = /compare/i.test(userMessage);
  if (isCompareRequest && sessionContext.lastProducts?.length >= 2) {
    const productsToCompare = sessionContext.lastProducts;
    const response = await generateChatResponse(
      `User asked: "${userMessage}"
Compare these products: ${JSON.stringify(productsToCompare.map((p) => ({ title: p.title || p.name, price: p.price, stock: p.in_stock !== false && p.stock !== 0, delivery: p.delivery_estimate || p.delivery_days })))}

Provide a helpful, detailed comparison table or bullet-point analysis comparing their features, price, availability, and delivery options, and recommend which one to choose under different circumstances. Keep the response friendly and conversational. Under 200 words.`,
      { model: 'main', systemInstruction: SYSTEM_INSTRUCTION, history: conversationHistory }
    );

    return {
      text: response,
      products: productsToCompare,
      lastProducts: productsToCompare,
    };
  }

  const action = detectShoppingAction(userMessage, sessionContext);
  const priceRange = extractPriceRange(userMessage);

  // ── Product detail / photo request ──
  if (action === 'get_detail' || sessionContext.selectedProduct) {
    try {
      const productRef = sessionContext.selectedProduct || { message: userMessage };
      const product = await fetchProductDetail(productRef, sessionContext);
      if (!product) {
        return {
          text: `I couldn't find that exact product. Could you tap **View Details** on a product card, or paste the product name in quotes?`,
          products: null,
        };
      }
      return buildProductDetailResponse(product, userMessage, conversationHistory);
    } catch (err) {
      console.error('[ShoppingAgent] Detail error:', err.message);
      return {
        text: `I had trouble loading that product's details. Please try tapping **View Details** on the product card.`,
        products: null,
        error: err.message,
      };
    }
  }

  // ── LLM intent extraction (supplemented by regex) ──
  const requestedCount = extractRequestedCount(userMessage);
  const budgetFallback = extractBudgetFallback(userMessage);
  let searchParams = { action: 'search', keyword: extractKeyword(userMessage), ...priceRange };

  // Apply budget typo fallback if regex didn't catch a price range
  if (budgetFallback != null && searchParams.maxPrice == null) {
    searchParams.maxPrice = budgetFallback;
  }

  try {
    const intentAnalysis = await generateChatResponse(
      `Analyze this shopping request and extract search parameters as JSON:
"${userMessage}"

Return ONLY valid JSON:
{
  "keyword": "search term (product name/category only, no price/budget words)",
  "minPrice": number or null,
  "maxPrice": number or null,
  "limit": number or null (how many products user wants, max 20),
  "sortBy": "price_asc|price_desc|popular" or null,
  "action": "search"
}

IMPORTANT: If the user says any of these budget typos, extract the number as maxPrice:
- "bdujet", "bdget", "bdjet", "budgt", "buget", "bugdet" → treat as "budget"
- "within X", "10000 bdujet" → maxPrice = X`,
      { model: 'main', systemInstruction: 'Return only valid JSON, no markdown.' }
    );
    let cleaned = intentAnalysis.trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];
    const parsed = JSON.parse(cleaned);
    searchParams = { ...searchParams, ...parsed };
  } catch {
    // regex fallback already set
  }

  // Regex values always win over LLM for price (more reliable)
  if (priceRange.minPrice != null) searchParams.minPrice = priceRange.minPrice;
  if (priceRange.maxPrice != null) searchParams.maxPrice = priceRange.maxPrice;
  // Typo budget wins if still nothing caught
  if (budgetFallback != null && searchParams.maxPrice == null) searchParams.maxPrice = budgetFallback;

  if (!searchParams.keyword) searchParams.keyword = extractKeyword(userMessage) || userMessage;

  // Determine how many products to fetch
  const userCount = requestedCount || searchParams.limit || null;
  const fetchLimit = userCount ? Math.min(Math.max(userCount, 4), 20) : 12;


  const results = { products: null, categories: null };

  try {
    if (searchParams.action === 'get_categories') {
      results.categories = await listCategories();
    } else {
      const searchResult = await searchProducts({
        keyword: searchParams.keyword || '',
        minPrice: searchParams.minPrice,
        maxPrice: searchParams.maxPrice,
        sortBy: searchParams.sortBy,
        limit: fetchLimit,
      });
      results.products = searchResult;
    }
  } catch (err) {
    console.error('[ShoppingAgent] MCP error:', err.message);
    return {
      text: `I'm having trouble connecting to Kapruka right now. Please try again in a moment. 🛒`,
      products: null,
      error: err.message,
    };
  }

  let products = normalizeProductList(results.products);

  // Client-side price filter (MCP may not filter accurately)
  if (products?.length && (searchParams.minPrice != null || searchParams.maxPrice != null)) {
    products = filterProductsByPrice(products, searchParams.minPrice, searchParams.maxPrice);
  }

  if (products?.length) {
    products = await enrichProductsWithDetails(products, products.length);
  }

  const priceNote =
    searchParams.minPrice || searchParams.maxPrice
      ? ` (budget LKR ${searchParams.minPrice ? searchParams.minPrice.toLocaleString('en-LK') + '–' : ''}${searchParams.maxPrice ? searchParams.maxPrice.toLocaleString('en-LK') : ''})`
      : '';
  const countNote = userCount ? ` (showing top ${Math.min(products?.length || 0, userCount)})` : '';

  const response = await generateChatResponse(
    `User asked: "${userMessage}"
Found ${products?.length || 0} products${priceNote}${countNote}.
Products: ${JSON.stringify(products?.map((p) => ({ title: p.title, price: p.price })) || [])}

Give a brief, helpful summary of the best matches for the user's need.
Product cards with photos and prices are shown below — don't list every product in text.
If no products found, suggest broader search terms. Under 120 words.`,
    { model: 'main', systemInstruction: SYSTEM_INSTRUCTION, history: conversationHistory }
  );

  // Honour the user's requested count in the returned list
  const finalProducts = userCount ? products?.slice(0, userCount) : products;

  return {
    text: response,
    products: finalProducts?.length ? finalProducts : null,
    categories: results.categories || null,
    searchParams,
    lastProducts: finalProducts,
  };
}
