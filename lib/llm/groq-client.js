import Groq from 'groq-sdk';

// Groq decommissioned llama-3.1-70b-versatile (Jan 2025).
// llama-3.3-70b-versatile is the official 70B replacement — same tier, works on free tier.
const MODELS = {
  main: 'llama-3.3-70b-versatile',
  fast: 'llama-3.1-8b-instant',
};

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const globalStore = globalThis;
  if (!globalStore.__kaprukaGroqKeyLogged) {
    console.log('[Groq] API key loaded:', apiKey ? `${apiKey.slice(0, 5)}...` : 'MISSING');
    globalStore.__kaprukaGroqKeyLogged = true;
  }

  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is missing. Add your key to .env.local (get one free at https://console.groq.com) and restart the dev server.'
    );
  }

  if (!globalStore.__kaprukaGroqClient) {
    globalStore.__kaprukaGroqClient = new Groq({ apiKey });
  }
  return globalStore.__kaprukaGroqClient;
}

function normalizeHistory(history = []) {
  return history
    .filter((msg) => msg && (msg.content || msg.parts))
    .map((msg) => {
      if (msg.parts) {
        return {
          role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.parts[0]?.text || '',
        };
      }

      return {
        role: msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user',
        content: msg.content || '',
      };
    })
    .filter((msg) => msg.content);
}

function buildMessages({ systemInstruction, history = [], prompt }) {
  const messages = [];

  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  messages.push(...normalizeHistory(history));

  if (prompt) {
    messages.push({ role: 'user', content: prompt });
  }

  return messages;
}

/**
 * Unified LLM wrapper for Groq chat completions.
 */
export async function generateChatResponse(
  prompt,
  { model = 'main', systemInstruction, history = [], stream = false } = {}
) {
  const modelKey = MODELS[model] ? model : 'main';
  const modelId = MODELS[modelKey];

  console.log(`[Groq] Using ${modelKey} model (${modelId})`);

  const groq = getGroqClient();
  const messages = buildMessages({ systemInstruction, history, prompt });

  if (stream) {
    return generateChatStream(groq, modelId, messages, modelKey);
  }

  const completion = await groq.chat.completions.create({
    model: modelId,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  });

  return completion.choices[0]?.message?.content?.trim() || '';
}

export async function* generateChatStream(groq, modelId, messages, modelKey) {
  console.log(`[Groq] Streaming with ${modelKey} model (${modelId})`);

  const stream = await groq.chat.completions.create({
    model: modelId,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}

export { MODELS };
