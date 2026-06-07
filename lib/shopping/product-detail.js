/**
 * Shared product detail lookup — always uses real Kapruka MCP data, never invented lists.
 */

import { getProduct, searchProducts } from '../services/product-service.js';
import { parseKaprukaProductMarkdown, sanitizeProductTitle } from '../mcp/product-parser.js';
import { normalizeProductList } from '../mcp/product-parser.js';
import { extractQuotedName, findBestProductMatch } from '../shopping/intent-parser.js';
import { generateChatResponse } from '../llm/groq-client.js';

const DETAIL_SYSTEM = `You describe ONE Kapruka product using ONLY the data provided.
Do NOT list other products. Do NOT invent features or prices.
The product photo is shown in the card below your message. Keep under 100 words.`;

export async function fetchProductDetail(productRef, sessionContext = {}) {
  const lastProducts = sessionContext.lastProducts || [];
  const message = productRef?.message || '';

  // View Details from card — selectedProduct has the ID
  if (!productRef?.id && !productRef?.product_id) {
    if (sessionContext.selectedProduct?.id || sessionContext.selectedProduct?.product_id) {
      return fetchProductDetail(sessionContext.selectedProduct, sessionContext);
    }
    if (/this product|this item|this one|details for this/i.test(message) && lastProducts.length === 1) {
      return fetchProductDetail(lastProducts[0], sessionContext);
    }
  }

  // Direct product from View Details click — most reliable
  if (productRef?.id || productRef?.product_id) {
    const productId = productRef.id || productRef.product_id;
    try {
      const detailRaw = await getProduct(productId);
      const parsed =
        typeof detailRaw === 'string' ? parseKaprukaProductMarkdown(detailRaw) : detailRaw;
      if (parsed) {
        return {
          ...productRef,
          ...parsed,
          id: productId,
          product_id: productId,
          title: sanitizeProductTitle(parsed.title || productRef.title),
          name: sanitizeProductTitle(parsed.name || parsed.title || productRef.title),
        };
      }
    } catch (err) {
      console.error('[ProductDetail] getProduct failed:', err.message);
    }
    return {
      ...productRef,
      title: sanitizeProductTitle(productRef.title || productRef.name),
    };
  }

  // Fallback: match by name from message
  const quoted = extractQuotedName(productRef?.message || '');
  let targetName = quoted;
  if (!targetName && productRef?.message) {
    const nameMatch = productRef.message.match(/(?:details? (?:and photo )?for|about)\s+"?([^"]+)"?/i);
    targetName = nameMatch?.[1]?.trim();
  }

  if (targetName && lastProducts.length) {
    const match = findBestProductMatch(lastProducts, targetName);
    if (match) return fetchProductDetail(match, sessionContext);
  }

  if (targetName) {
    const searchResult = await searchProducts({ keyword: targetName, limit: 5 });
    const candidates = normalizeProductList(searchResult) || [];
    const match = findBestProductMatch(candidates, targetName);
    if (match) return fetchProductDetail(match, sessionContext);
  }

  return null;
}

export async function buildProductDetailResponse(product, userMessage, conversationHistory = []) {
  const fallback = `${product.title || product.name} — LKR ${(product.price || 0).toLocaleString('en-LK')}. ${product.in_stock !== false ? 'In stock on Kapruka.' : 'Check stock on Kapruka.'} See the photo and full details in the product card below.`;

  let text = fallback;
  try {
    text = await generateChatResponse(
      `User wants details for this ONE product:
${JSON.stringify(product, null, 2)}

Describe: name, price in LKR, stock, category, description, why it's a good gift.
The photo is in the product card below — mention that. Do NOT suggest other products.`,
      {
        model: 'main',
        systemInstruction: DETAIL_SYSTEM,
        history: conversationHistory,
      }
    );
  } catch (err) {
    console.error('[ProductDetail] LLM summary error:', err.message);
  }

  return {
    text,
    products: [product],
    productDetail: product,
    lastProducts: [product],
  };
}
