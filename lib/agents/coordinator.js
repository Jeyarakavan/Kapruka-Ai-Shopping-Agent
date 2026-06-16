/**
 * Coordinator Agent
 * Routes user requests to the appropriate specialized sub-agent
 */

import { generateChatResponse } from '../llm/groq-client.js';
import { runShoppingAgent } from './shopping-agent.js';
import { runGiftAgent } from './gift-agent.js';
import { runDeliveryAgent } from './delivery-agent.js';
import { runCheckoutAgent } from './checkout-agent.js';
import { runTrackingAgent } from './tracking-agent.js';

const COORDINATOR_INSTRUCTION = `You are the Kapruka Genie Coordinator.
Classify user intent into exactly ONE category:
- "shopping": product search, browse, compare, find items, recommendations
- "gift": gift ideas, birthday/anniversary/wedding gifts, gifting for occasions
- "delivery": delivery cities, shipping costs, delivery dates, city availability
- "checkout": buy now, place order, checkout, add address, payment, order creation
- "tracking": track order, order status, where is my package
- "general": greetings, help, questions about Kapruka, anything else

Return ONLY the category word, nothing else.`;

const GENERAL_SYSTEM = `You are Kapruka Genie 🧞 — a premium AI shopping assistant for Sri Lanka's #1 e-commerce platform, Kapruka.com.

You're charming, knowledgeable about Sri Lankan culture, and passionate about helping people find perfect products and gifts.

You can help with:
🛍️ Shopping & product discovery
🎁 Gift recommendations for any occasion  
🚚 Delivery information across Sri Lanka
💳 Easy checkout & order placement
📦 Order tracking

Always respond in a friendly, enthusiastic tone that reflects Sri Lankan warmth.`;

import { isShowProductsRequest, isProductDetailRequest } from '../shopping/gift-context.js';

function detectIntentFast(message, sessionContext = {}) {
  const lower = message.toLowerCase();

  if (sessionContext.forceCheckout || /i want to buy|help me checkout|start checkout|place order|buy this/i.test(lower)) {
    return 'checkout';
  }
  if (/proceed to checkout|checkout my cart|ready to checkout/i.test(lower)) return 'checkout';
  if (/track (my )?order|order status|where is my package/i.test(lower)) return 'tracking';
  if (/deliver|delivery|ship to|can this deliver/i.test(lower)) return 'delivery';

  // View Details — single product from MCP, never re-run gift search
  if (sessionContext.selectedProduct || isProductDetailRequest(message)) {
    if (sessionContext.giftContext?.active || sessionContext.giftContext?.budget) {
      return 'gift';
    }
    return 'shopping';
  }

  // Ongoing gift flow — stay on gift agent
  if (sessionContext.giftContext?.active || sessionContext.giftContext?.budget) {
    if (isShowProductsRequest(message) || /gift|girl\s*friend|boy\s*friend|she|her|he|him/i.test(lower)) {
      return 'gift';
    }
  }

  if (
    /gift|birthday|anniversary|wedding gift|girl\s*friend|boy\s*friend|girlfriend|boyfriend|sujugst|suggest.*gift|bdujet|bdget|bdjet/i.test(
      lower
    )
  ) {
    return 'gift';
  }

  return null;
}

export async function runCoordinator(
  userMessage,
  conversationHistory = [],
  sessionContext = {}
) {
  // Fast rule-based routing for critical flows (buy, track, deliver)
  let intent = detectIntentFast(userMessage, sessionContext) || 'general';

  if (intent === 'general') {
    try {
      const classification = await generateChatResponse(userMessage, {
        model: 'main',
        systemInstruction: COORDINATOR_INSTRUCTION,
        history: conversationHistory.slice(-4),
      });
      intent = classification.trim().toLowerCase();
      if (!['shopping', 'gift', 'delivery', 'checkout', 'tracking', 'general'].includes(intent)) {
        intent = 'general';
      }
    } catch (err) {
      console.error('[Coordinator] Classification error:', err.message);
      intent = 'shopping';
    }
  }

  console.log(`[Coordinator] Intent: ${intent} | Message: "${userMessage.slice(0, 50)}..."`);

  // Route to appropriate agent
  try {
    switch (intent) {
      case 'shopping':
        return {
          ...(await runShoppingAgent(userMessage, conversationHistory, sessionContext)),
          intent,
        };

      case 'gift': {
        const giftResult = await runGiftAgent(
          userMessage,
          conversationHistory,
          sessionContext
        );
        return { ...giftResult, intent };
      }

      case 'delivery':
        return {
          ...(await runDeliveryAgent(
            userMessage,
            conversationHistory,
            sessionContext.deliveryContext || {}
          )),
          intent,
        };

      case 'checkout': {
        const cartItem = sessionContext.cart?.[0];
        const checkoutData = sessionContext.checkoutData?.productId
          ? sessionContext.checkoutData
          : cartItem
            ? {
                productId: cartItem.productId,
                productTitle: cartItem.title,
                productPrice: cartItem.price,
              }
            : sessionContext.checkoutData || {};
        return {
          ...(await runCheckoutAgent(
            userMessage,
            conversationHistory,
            checkoutData,
            sessionContext.isConfirmation || false
          )),
          intent,
        };
      }

      case 'tracking':
        return {
          ...(await runTrackingAgent(
            userMessage,
            conversationHistory,
            sessionContext.trackingContext || {}
          )),
          intent,
        };

      default:
        // General response — fast model for simple replies
        const response = await generateChatResponse(userMessage, {
          model: 'fast',
          systemInstruction: GENERAL_SYSTEM,
          history: conversationHistory,
        });
        return {
          text: response,
          intent: 'general',
          products: null,
        };
    }
  } catch (err) {
    console.error(`[Coordinator] Agent error for intent "${intent}":`, err.message);
    return {
      text: `I encountered a small hiccup! 😅 Please try rephrasing your request, or ask me to help you shop, find gifts, check delivery, or track an order.`,
      intent,
      error: err.message,
    };
  }
}
