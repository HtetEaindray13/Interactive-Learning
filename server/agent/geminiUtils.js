import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';
const DEFAULT_OPENROUTER_MODEL = 'openrouter/free';
const RETIRED_MODEL_ALIASES = new Set(['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite']);

/**
 * Strip markdown code fences and extract the first JSON object from model output.
 */
export function extractJson(text) {
  let cleaned = text.trim();

  // Remove ```json ... ``` or ``` ... ``` wrappers
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // If prose surrounds JSON, grab the first { ... } block
  const braceStart = cleaned.indexOf('{');
  const braceEnd = cleaned.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    cleaned = cleaned.slice(braceStart, braceEnd + 1);
  }

  return JSON.parse(cleaned);
}

export function normalizeGeminiModelName(modelName) {
  const configuredModel = modelName?.trim();
  return RETIRED_MODEL_ALIASES.has(configuredModel)
    ? DEFAULT_GEMINI_MODEL
    : configuredModel || DEFAULT_GEMINI_MODEL;
}

export function isGeminiQuotaError(err) {
  const message = err?.message ?? '';
  return err?.status === 429 || message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota');
}

export function isGeminiUnsupportedLocationError(err) {
  const message = err?.message ?? '';
  return (
    err?.status === 400 &&
    message.includes('User location is not supported for the API use')
  );
}

export function isGeminiNetworkError(err) {
  const message = err?.message ?? '';
  return message.includes('fetch failed') || message.includes('ECONNRESET') || message.includes('ENOTFOUND');
}

class OpenRouterChatModel {
  constructor(apiKey, modelName) {
    this.apiKey = apiKey;
    this.modelName = modelName || DEFAULT_OPENROUTER_MODEL;
  }

  async generateContent(prompt) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'http://localhost:5173',
        'X-OpenRouter-Title': process.env.OPENROUTER_APP_TITLE ?? 'Interactive Learning Teaching Builder',
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content:
              'You produce concise classroom-ready JSON for an educational TypeScript and Three.js app. Return valid JSON when asked.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.25,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message ?? data?.message ?? response.statusText;
      const error = new Error(`OpenRouter API error (${response.status}): ${message}`);
      error.status = response.status;
      throw error;
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenRouter API returned no message content.');
    }

    return {
      response: {
        text: () => content,
      },
    };
  }
}

export function getModel() {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    return new OpenRouterChatModel(openRouterKey, process.env.OPENROUTER_MODEL);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No AI API key is set. Add OPENROUTER_API_KEY or GEMINI_API_KEY to .env.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = normalizeGeminiModelName(process.env.GEMINI_MODEL);

  return genAI.getGenerativeModel({ model: modelName });
}
