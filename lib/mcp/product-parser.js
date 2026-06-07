/**
 * Parse Kapruka MCP markdown responses into structured product objects for the UI.
 */

export function parseKaprukaSearchMarkdown(text) {
  if (!text || typeof text !== 'string') return [];
  if (/no products found/i.test(text)) return [];

  const products = [];
  const productRegex =
    /\*\*(\d+)\.\s*(.+?)\*\*\s*\n\s*ID:\s*`([^`]+)`\s*·\s*LKR\s*([\d,]+)\s*·\s*([^·\n]+)(?:\s*·\s*([^\n]+))?\s*\n\s*\[View product\]\((https:\/\/[^)]+)\)/gi;

  let match;
  while ((match = productRegex.exec(text)) !== null) {
    const price = parseFloat(match[4].replace(/,/g, ''));
    const stockStatus = match[5].trim();

    products.push({
      id: match[3].trim(),
      product_id: match[3].trim(),
      title: match[2].trim(),
      name: match[2].trim(),
      price,
      selling_price: price,
      currency: 'LKR',
      stock_status: stockStatus,
      in_stock: !/out of stock/i.test(stockStatus),
      shipping: match[6]?.trim() || null,
      url: match[7].trim(),
      product_url: match[7].trim(),
    });
  }

  return products;
}

export function parseKaprukaProductMarkdown(text) {
  if (!text || typeof text !== 'string') return null;

  const titleMatch = text.match(/^##\s+(.+)/m);
  const idMatch = text.match(/\*\*ID\*\*:\s*`([^`]+)`/i);
  const priceMatch = text.match(/\*\*Price\*\*:\s*LKR\s*([\d,]+)/i);
  const stockMatch = text.match(/\*\*Stock\*\*:\s*(.+)/i);
  const categoryMatch = text.match(/\*\*Category\*\*:\s*(.+)/i);
  const imageMatch = text.match(/\*\*Image\*\*:\s*(https?:\/\/\S+)/i);
  const urlMatch = text.match(/\[View on Kapruka\]\((https:\/\/[^)]+)\)/i);
  const descMatch = text.match(/\n\n([^*\n][^\n]+(?:\n[^*\n#][^\n]*)*)\n\n\*\*Image\*\*/);

  const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;

  const parsed = {
    id: idMatch?.[1]?.trim(),
    product_id: idMatch?.[1]?.trim(),
    title: titleMatch?.[1]?.trim(),
    name: titleMatch?.[1]?.trim(),
    price,
    selling_price: price,
    currency: 'LKR',
    stock_status: stockMatch?.[1]?.trim(),
    in_stock: stockMatch ? !/out of stock/i.test(stockMatch[1]) : true,
    category: categoryMatch?.[1]?.trim(),
    image: imageMatch?.[1]?.trim(),
    thumbnail: imageMatch?.[1]?.trim(),
    description: descMatch?.[1]?.trim(),
    url: urlMatch?.[1]?.trim(),
    product_url: urlMatch?.[1]?.trim(),
  };

  return {
    ...parsed,
    title: sanitizeProductTitle(parsed.title || parsed.name),
    name: sanitizeProductTitle(parsed.name || parsed.title),
  };
}

/** Clean broken HTML entity encoding from Kapruka titles */
export function sanitizeProductTitle(title) {
  if (!title || typeof title !== 'string') return title;
  return title
    .replace(/N#226;n#8364;n#8220;/gi, "'")
    .replace(/N#226;n#8364;n#8221;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize any MCP product payload into a UI-ready array.
 */
export function normalizeProductList(data) {
  if (!data) return null;

  let list = null;
  if (Array.isArray(data)) {
    list = data.length ? data : null;
  } else if (typeof data === 'string') {
    const parsed = parseKaprukaSearchMarkdown(data);
    list = parsed.length ? parsed : null;
  } else if (typeof data === 'object') {
    if (Array.isArray(data.products)) list = data.products.length ? data.products : null;
    else if (typeof data.products === 'string') {
      const parsed = parseKaprukaSearchMarkdown(data.products);
      list = parsed.length ? parsed : null;
    } else if (data.id || data.product_id) list = [data];
  }

  if (!list) return null;
  return list.map((p) => ({
    ...p,
    title: sanitizeProductTitle(p.title || p.name),
    name: sanitizeProductTitle(p.name || p.title),
  }));
}
