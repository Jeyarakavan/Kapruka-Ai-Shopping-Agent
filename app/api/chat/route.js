import { runCoordinator } from '@/lib/agents/coordinator';
import { canMakeChatRequest, getChatWaitTime } from '@/lib/rate-limiter';
import { validateSessionContext } from '@/lib/session';
import { detectLanguage, translate } from '@/lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const body = await request.json();
        const { message, history = [], sessionContext = {} } = body;

        if (!message?.trim()) {
          sendEvent({ error: 'Message is required' });
          controller.close();
          return;
        }

        // Rate limit check for Chat requests (using the dedicated chatBucket)
        const waitTime = getChatWaitTime();
        if (waitTime > 0 && !canMakeChatRequest()) {
          sendEvent({
            error: `Rate limit reached. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
            rateLimited: true,
          });
          controller.close();
          return;
        }

        // Validate session context
        const validatedContext = validateSessionContext(sessionContext);

        // Auto-detect language
        const detectedLang = detectLanguage(message);
        validatedContext.lang = detectedLang;

        // Normalize conversation history for Groq
        const chatHistory = (history || [])
          .filter((m) => m.role && m.content)
          .map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          }));

        // Run coordinator with validated session context
        const result = await runCoordinator(message, chatHistory, validatedContext);

        // Stream the text response character by character for typing effect
        if (result.text) {
          const words = result.text.split(' ');
          for (let i = 0; i < words.length; i++) {
            sendEvent({
              type: 'text',
              chunk: (i === 0 ? '' : ' ') + words[i],
              done: false,
            });
            // Small delay for streaming effect
            await new Promise((r) => setTimeout(r, 15));
          }
        }

        // Send structured data (products, tracking, etc.) along with language context
        sendEvent({
          type: 'complete',
          done: true,
          intent: result.intent,
          products: result.products || null,
          categories: result.categories || null,
          tracking: result.tracking || null,
          checkoutData: result.checkoutData || null,
          order: result.order || null,
          paymentUrl: result.paymentUrl || null,
          awaitingConfirmation: result.awaitingConfirmation || false,
          needsMoreInfo: result.needsMoreInfo || false,
          deliveryInfo: result.deliveryInfo || null,
          cities: result.cities || null,
          lastProducts: result.lastProducts || result.products || null,
          giftContext: result.giftContext || null,
          cart: result.cart || null,
          lang: detectedLang,
        });
      } catch (err) {
        console.error('[Chat API] Error:', err.message);
        sendEvent({
          type: 'error',
          error: 'Something went wrong. Please try again.',
          done: true,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
