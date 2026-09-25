/**
 * aiConfig.ts
 * Single source of truth for LLM provider configuration.
 * Re-reads process.env on every call so hot-.env reloads work in dev.
 */
import dotenv from 'dotenv';

export interface AiConfig {
  provider: 'gemini' | 'openai' | 'ollama' | null;
  key: string | null;
  model: string;
  baseUrl?: string;
}

export function getAiConfig(): AiConfig {
  // Re-read .env on every call — picks up changes without server restart in dev
  dotenv.config({ override: true });

  const customModel = process.env.AI_MODEL?.trim();

  // 1. Google Gemini
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey && geminiKey.length > 5) {
    return {
      provider: 'gemini',
      key: geminiKey,
      // gemini-3.8-flash is the default fast model on v1beta
      model: customModel || 'gemini-3.8-flash',
    };
  }

  // 2. OpenAI
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const openaiBaseUrl = process.env.OPENAI_BASE_URL?.trim();
  if (openaiKey && openaiKey.length > 5) {
    return {
      provider: 'openai',
      key: openaiKey,
      model: customModel || 'gpt-4o-mini',
      baseUrl: openaiBaseUrl || 'https://api.openai.com/v1',
    };
  }

  // 3. Local OpenAI-compatible (Ollama / vLLM / LM Studio)
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL?.trim();
  if (ollamaBaseUrl) {
    return {
      provider: 'ollama',
      key: 'local',
      model: customModel || 'llama3.1',
      baseUrl: `${ollamaBaseUrl.replace(/\/$/, '')}/v1`,
    };
  }

  return { provider: null, key: null, model: '' };
}

export function getAiStatus(): {
  configured: boolean;
  provider: 'gemini' | 'openai' | 'ollama' | null;
  model: string;
} {
  // Calls getAiConfig() live every time — never returns stale values
  const config = getAiConfig();
  return {
    configured: Boolean(config.provider && config.key),
    provider: config.provider,
    model: config.model,
  };
}
