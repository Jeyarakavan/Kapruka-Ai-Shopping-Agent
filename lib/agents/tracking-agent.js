/**
 * Tracking Agent
 * Tracks orders by order number, displays status and timeline
 */

import { getOrderTracking } from '../services/tracking-service.js';
import { generateChatResponse } from '../llm/groq-client.js';

const SYSTEM_INSTRUCTION = `You are the Kapruka Order Tracker — efficient, clear, and reassuring.
You help customers track their Kapruka orders and understand delivery status.

When presenting tracking info:
- Show order status prominently
- Display delivery timeline clearly  
- Mention estimated delivery date
- If delayed, be empathetic and suggest contacting support
- Always show recipient and delivery details

Be reassuring and professional.`;

export async function runTrackingAgent(userMessage, conversationHistory = [], trackingContext = {}) {
  // Extract order number from message
  const orderNumberExtract = await generateChatResponse(
    `Extract the order number from: "${userMessage}"
Return ONLY the order number string, or empty string if none found.
Order numbers on Kapruka are typically numeric (e.g., 12345678).`,
    { model: 'fast', systemInstruction: 'Return only the order number or empty string.' }
  );

  const orderNumber = orderNumberExtract.trim() || trackingContext.orderNumber;

  if (!orderNumber) {
    return {
      text: `To track your order, please provide your **Kapruka order number**. 
You can find it in:
• Your confirmation email
• SMS from Kapruka
• The payment receipt

Example: "Track order 12345678"`,
      tracking: null,
      needsOrderNumber: true,
    };
  }

  let tracking = null;
  try {
    tracking = await getOrderTracking(orderNumber);
  } catch (err) {
    console.error('[TrackingAgent] Error:', err.message);
    return {
      text: `I couldn't find order **#${orderNumber}**. Please check:
• The order number is correct
• The order was placed on Kapruka.com
• Try again in a few minutes

If the issue persists, contact Kapruka support at support@kapruka.com`,
      tracking: null,
      error: err.message,
    };
  }

  const response = await generateChatResponse(
    `Customer is tracking order #${orderNumber}
Tracking data: ${JSON.stringify(tracking, null, 2)}

Provide a clear, reassuring tracking update. Include:
- Current status (bold/prominent)
- Expected delivery date
- Delivery address/recipient if available
- Next steps or what to expect
Be warm and professional. Keep it concise.`,
    {
      model: 'main',
      systemInstruction: SYSTEM_INSTRUCTION,
      history: conversationHistory,
    }
  );

  return {
    text: response,
    tracking,
    orderNumber,
  };
}
