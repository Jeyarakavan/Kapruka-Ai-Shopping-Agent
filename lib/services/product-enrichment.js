import { getProduct } from './product-service.js';
import { parseKaprukaProductMarkdown } from '../mcp/product-parser.js';

/**
 * Fetch product images and extra details from Kapruka for search results.
 */
export async function enrichProductsWithDetails(products, limit = 8) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const toEnrich = products.slice(0, limit).filter((p) => p?.id || p?.product_id);

  const enriched = await Promise.all(
    toEnrich.map(async (product) => {
      if (product.image) return product;

      try {
        const detail = await getProduct(product.id || product.product_id);
        const parsed = typeof detail === 'string'
          ? parseKaprukaProductMarkdown(detail)
          : detail;

        if (!parsed) return product;

        return {
          ...product,
          image: parsed.image || product.image,
          thumbnail: parsed.thumbnail || parsed.image || product.thumbnail,
          description: parsed.description || product.description,
          category: parsed.category || product.category,
          in_stock: parsed.in_stock ?? product.in_stock,
          stock_status: parsed.stock_status || product.stock_status,
        };
      } catch {
        return product;
      }
    })
  );

  return [...enriched, ...products.slice(limit)];
}
