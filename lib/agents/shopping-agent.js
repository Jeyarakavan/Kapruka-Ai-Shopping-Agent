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
  let searchParams = { action: 'search', keyword: extractKeyword(userMessage), ...priceRange };

  try {
    const intentAnalysis = await generateChatResponse(
      `Analyze this shopping request and extract search parameters as JSON:
"${userMessage}"

Return ONLY valid JSON:
{
  "keyword": "search term",
  "minPrice": number or null,
  "maxPrice": number or null,
  "sortBy": "price_asc|price_desc|popular" or null,
  "action": "search"
}`,
      { model: 'main', systemInstruction: 'Return only valid JSON, no markdown.' }
    );
    const cleaned = intentAnalysis.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    searchParams = { ...searchParams, ...parsed };
  } catch {
    // regex fallback already set
  }

  if (!searchParams.keyword) searchParams.keyword = extractKeyword(userMessage) || userMessage;
  if (priceRange.minPrice != null) searchParams.minPrice = priceRange.minPrice;
  if (priceRange.maxPrice != null) searchParams.maxPrice = priceRange.maxPrice;

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
        limit: 12,
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
      ? ` (filtered LKR ${searchParams.minPrice || 0} – ${searchParams.maxPrice || '∞'})`
      : '';

  const response = await generateChatResponse(
    `User asked: "${userMessage}"
Found ${products?.length || 0} products${priceNote}.
Products: ${JSON.stringify(products?.map((p) => ({ title: p.title, price: p.price })) || [])}

Give a brief, helpful summary of the best matches for the user's need.
Product cards with photos and prices are shown below — don't list every product in text.
If no products found, suggest broader search terms. Under 120 words.`,
    { model: 'main', systemInstruction: SYSTEM_INSTRUCTION, history: conversationHistory }
  );

  return {
    text: response,
    products: products?.length ? products : null,
    categories: results.categories || null,
    searchParams,
    lastProducts: products,
  };
}
