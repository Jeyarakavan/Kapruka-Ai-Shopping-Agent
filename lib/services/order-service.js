import { executeTool } from '../mcp/client.js';
import { canCreateOrder } from '../rate-limiter.js';

export async function createGuestOrder(orderData) {
  // Enforce double checks and validation before calling MCP
  if (!orderData.product_id) throw new Error('Product is required.');
  if (!orderData.recipient_name) throw new Error("Recipient's name is required.");
  if (!orderData.recipient_phone) throw new Error("Recipient's phone number is required.");
  if (!orderData.delivery_address) throw new Error('Delivery address is required.');
  if (!orderData.city_id) throw new Error('Delivery city is required.');
  if (!orderData.delivery_date) throw new Error('Delivery date is required.');
  if (!orderData.sender_name) throw new Error("Sender's name is required.");

  // Enforce rate limiter
  if (!canCreateOrder()) {
    throw new Error('Order creation limit exceeded. Please wait a few minutes and try again.');
  }

  return executeTool('kapruka_create_order', orderData);
}
