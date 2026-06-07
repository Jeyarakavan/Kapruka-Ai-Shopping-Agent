/**
 * Delivery Agent
 * Handles: city lookup, delivery validation, scheduling, perishable warnings
 */

import { listDeliveryCities, checkDelivery } from '../services/delivery-service.js';
import { generateChatResponse } from '../llm/groq-client.js';

const SYSTEM_INSTRUCTION = `You are the Kapruka Delivery Specialist — an expert on Sri Lanka delivery logistics.
You help customers understand delivery options, costs, and timelines across Sri Lanka.

Key knowledge:
- Same-day delivery available in Colombo and suburbs
- Island-wide delivery across all districts
- Perishable items (cakes, flowers, fresh food) have delivery restrictions
- Delivery costs vary by city and product
- Always display delivery date estimates clearly

Be helpful and proactive about potential delivery issues.`;

export async function runDeliveryAgent(userMessage, conversationHistory = [], deliveryContext = {}) {
  const lowerMsg = userMessage.toLowerCase();

  // Detect what the user needs
  const isCitySearch =
    lowerMsg.includes('city') || lowerMsg.includes('deliver') || lowerMsg.includes('cities') || lowerMsg.includes('where');
  const isDeliveryCheck =
    lowerMsg.includes('check') ||
    lowerMsg.includes('available') ||
    lowerMsg.includes('cost') ||
    lowerMsg.includes('fee') ||
    lowerMsg.includes('schedule') ||
    deliveryContext.productId;

  let cities = null;
  let deliveryInfo = null;

  try {
    if (isCitySearch || !isDeliveryCheck) {
      // Extract city search term
      const citySearch = await generateChatResponse(
        `From this message: "${userMessage}"
Extract ONLY the city/town name being searched for, or return empty string if none.
Return ONLY the city name, nothing else.`,
        { model: 'fast', systemInstruction: 'Return only the city name or empty string.' }
      );
      cities = await listDeliveryCities(citySearch.trim());
    }

    if (isDeliveryCheck && deliveryContext.productId && deliveryContext.cityId) {
      deliveryInfo = await checkDelivery({
        productId: deliveryContext.productId,
        cityId: deliveryContext.cityId,
        date: deliveryContext.date,
      });
    }
  } catch (err) {
    console.error('[DeliveryAgent] MCP error:', err.message);
    return {
      text: `I'm having trouble checking delivery information right now. Please try again shortly. 🚚`,
      cities: null,
      deliveryInfo: null,
      error: err.message,
    };
  }

  const context = {
    cities: cities ? (Array.isArray(cities) ? cities.slice(0, 20) : cities) : null,
    deliveryInfo,
    deliveryContext,
  };

  const response = await generateChatResponse(
    `Delivery question: "${userMessage}"

Delivery data from Kapruka:
${JSON.stringify(context, null, 2)}

Respond helpfully about delivery options. 
- If delivery is available, show cost and estimated date clearly
- If perishable warning exists, highlight it prominently with ⚠️
- If city not found, suggest nearby cities
- Format costs in LKR
Keep response concise and actionable.`,
    {
      model: 'main',
      systemInstruction: SYSTEM_INSTRUCTION,
      history: conversationHistory,
    }
  );

  return {
    text: response,
    cities: Array.isArray(cities) ? cities : null,
    deliveryInfo,
  };
}
