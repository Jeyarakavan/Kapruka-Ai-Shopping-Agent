import { executeTool } from '../mcp/client.js';

export async function listDeliveryCities(search = '') {
  return executeTool('kapruka_list_delivery_cities', search ? { query: search } : {});
}

export async function checkDelivery({ productId, cityId, date }) {
  if (!productId || !cityId) {
    throw new Error('Product ID and City ID are required to check delivery availability.');
  }
  return executeTool('kapruka_check_delivery', {
    product_id: productId,
    city_id: cityId,
    ...(date && { delivery_date: date }),
  });
}
