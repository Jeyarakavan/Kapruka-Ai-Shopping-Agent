/**
 * Checkout Agent
 * Collects order details, confirms, creates order, returns payment URL
 */

import { createGuestOrder } from '../services/order-service.js';
import { generateChatResponse } from '../llm/groq-client.js';
import { canCreateOrder } from '../rate-limiter.js';

const SYSTEM_INSTRUCTION = `You are the Kapruka Checkout Assistant — precise, trustworthy, and efficient.
You guide customers through the checkout process on Kapruka.com, Sri Lanka's leading e-commerce platform.

Your responsibilities:
1. Collect all required order information step-by-step
2. Validate information before proceeding
3. Ask for explicit confirmation before creating any order
4. Display the 60-minute price lock warning clearly

Required fields for checkout:
- Product ID and variant (if applicable)
- Recipient: name, phone number (Sri Lanka format: +94XXXXXXXXX)
- Delivery: address, city, preferred date
- Sender name
- Gift message (optional)

Important: NEVER create an order without explicit user confirmation.
Always ask: "Would you like me to create this order and generate a payment link?"`;

// Required checkout fields
const REQUIRED_FIELDS = [
  'productId',
  'recipientName',
  'recipientPhone',
  'deliveryAddress',
  'cityId',
  'deliveryDate',
  'senderName',
];

export function getCheckoutStatus(checkoutData) {
  const missing = REQUIRED_FIELDS.filter((f) => !checkoutData[f]);
  return {
    isComplete: missing.length === 0,
    missingFields: missing,
    completionPercent: Math.round(
      ((REQUIRED_FIELDS.length - missing.length) / REQUIRED_FIELDS.length) * 100
    ),
  };
}

export async function runCheckoutAgent(
  userMessage,
  conversationHistory = [],
  checkoutData = {},
  isConfirmation = false
) {
  // If coordinator flagged this as a confirmation, treat it as confirmed
  if (isConfirmation && !checkoutData.confirmed) {
    const { isComplete } = getCheckoutStatus(checkoutData);
    if (isComplete) {
      return runCheckoutAgent(userMessage, conversationHistory, { ...checkoutData, confirmed: true }, true);
    }
  }

  // If user has confirmed and we have all data — create the order
  if (isConfirmation && checkoutData.confirmed) {
    const { isComplete, missingFields } = getCheckoutStatus(checkoutData);

    if (!isComplete) {
      return {
        text: `I still need a few more details before I can create the order:\n${missingFields.map((f) => `• ${formatFieldName(f)}`).join('\n')}`,
        checkoutData,
        orderCreated: false,
      };
    }

    // Rate limit check
    if (!canCreateOrder()) {
      return {
        text: `⚠️ I've reached the order creation limit for now. Please wait a few minutes and try again. Your cart is saved!`,
        checkoutData,
        orderCreated: false,
        rateLimited: true,
      };
    }

    try {
      const orderPayload = {
        product_id: checkoutData.productId,
        recipient_name: checkoutData.recipientName,
        recipient_phone: checkoutData.recipientPhone,
        delivery_address: checkoutData.deliveryAddress,
        city_id: checkoutData.cityId,
        delivery_date: checkoutData.deliveryDate,
        sender_name: checkoutData.senderName,
        ...(checkoutData.giftMessage && { gift_message: checkoutData.giftMessage }),
        ...(checkoutData.variantId && { variant_id: checkoutData.variantId }),
        currency: 'LKR',
      };

      const order = await createGuestOrder(orderPayload);

      return {
        text: `🎉 **Order Created Successfully!**\n\nYour order has been placed. Click the payment link below to complete your purchase.\n\n⏰ **Prices are reserved for 60 minutes. Complete payment before expiration.**`,
        checkoutData,
        order,
        orderCreated: true,
        paymentUrl: order?.payment_url || order?.click_to_pay_url || null,
      };
    } catch (err) {
      console.error('[CheckoutAgent] Order creation failed:', err.message);
      return {
        text: `❌ I couldn't create the order due to a technical issue: ${err.message}\n\nPlease try again or contact Kapruka support.`,
        checkoutData,
        orderCreated: false,
        error: err.message,
      };
    }
  }

  // Extract checkout info from the user's message
  const extractedInfo = await generateChatResponse(
    `Extract checkout information from this message:
"${userMessage}"

Current checkout data: ${JSON.stringify(checkoutData)}

Return ONLY valid JSON with any of these fields found in the message:
{
  "productId": "string",
  "recipientName": "string",
  "recipientPhone": "string (Sri Lanka format)",
  "deliveryAddress": "string",
  "cityId": "string",
  "deliveryDate": "YYYY-MM-DD",
  "senderName": "string",
  "giftMessage": "string",
  "variantId": "string",
  "userConfirmed": boolean (true if user says yes/confirm/proceed)
}

Only include fields that are explicitly mentioned. Return {} if nothing found.`,
    { model: 'main', systemInstruction: 'Return only valid JSON, no markdown.' }
  );

  let extracted = {};
  try {
    const cleaned = extractedInfo.replace(/```json|```/g, '').trim();
    extracted = JSON.parse(cleaned);
  } catch (err) {}

  // Merge extracted data
  const updatedData = { ...checkoutData, ...extracted };

  // Handle confirmation
  if (extracted.userConfirmed) {
    updatedData.confirmed = true;
    return runCheckoutAgent(userMessage, conversationHistory, updatedData, true);
  }

  const { isComplete, missingFields } = getCheckoutStatus(updatedData);

  // Generate next step response
  const response = await generateChatResponse(
    `Checkout assistant context:
User said: "${userMessage}"
Current order data: ${JSON.stringify(updatedData)}
Is complete: ${isComplete}
Missing fields: ${JSON.stringify(missingFields)}

${
  isComplete
    ? `All information collected! Show a complete order summary and ask:
"Would you like me to create this order and generate a payment link?"
Format the summary clearly with all details.`
    : `Ask for the next missing field naturally: ${missingFields[0]}
Be friendly and guide the user step-by-step.`
}`,
    {
      model: 'main',
      systemInstruction: SYSTEM_INSTRUCTION,
      history: conversationHistory,
    }
  );

  return {
    text: response,
    checkoutData: updatedData,
    isComplete,
    missingFields,
    orderCreated: false,
    awaitingConfirmation: isComplete && !updatedData.confirmed,
  };
}

function formatFieldName(field) {
  const names = {
    productId: 'Product',
    recipientName: "Recipient's name",
    recipientPhone: "Recipient's phone number",
    deliveryAddress: 'Delivery address',
    cityId: 'Delivery city',
    deliveryDate: 'Delivery date',
    senderName: "Your name (sender)",
  };
  return names[field] || field;
}
