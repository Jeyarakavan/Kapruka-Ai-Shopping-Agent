import { executeTool } from '../mcp/client.js';

export async function getOrderTracking(orderNumber) {
  if (!orderNumber) {
    throw new Error('Order number is required.');
  }
  return executeTool('kapruka_track_order', { order_number: orderNumber });
}
