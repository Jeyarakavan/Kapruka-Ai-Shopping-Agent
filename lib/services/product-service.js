import { executeTool } from '../mcp/client.js';

export async function searchProducts({
  keyword = '',
  category = '',
  minPrice,
  maxPrice,
  inStock,
  sortBy,
  page = 1,
  limit = 12,
  currency = 'LKR',
} = {}) {
  const params = { limit };
  if (keyword) params.q = keyword;
  if (category) params.category = category;
  if (minPrice !== undefined) params.min_price = minPrice;
  if (maxPrice !== undefined) params.max_price = maxPrice;
  if (inStock !== undefined) params.in_stock = inStock;
  if (sortBy) params.sort_by = sortBy;
  return executeTool('kapruka_search_products', params);
}

export async function getProduct(productId, currency = 'LKR') {
  return executeTool('kapruka_get_product', { product_id: productId, currency });
}

export async function listCategories() {
  return executeTool('kapruka_list_categories', {});
}
