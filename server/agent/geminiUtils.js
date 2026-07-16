import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';
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

export function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = normalizeGeminiModelName(process.env.GEMINI_MODEL);

  return genAI.getGenerativeModel({ model: modelName });
}
