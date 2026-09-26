/**
 * classificationService.ts
 * Responsibility: Batch LLM-based transaction categorization.
 * Sends a batch of raw transactions to Gemini or OpenAI and gets structured
 * FinancialCategory classifications back.
 */
import { getAiConfig, AiConfig } from './aiConfig.js';
import { FinancialCategory } from '../models/Transaction.js';

export interface AiClassificationResult {
  transactionId: string;
  category: FinancialCategory;
  pnlTreatment: 'INCLUDED_IN_PNL' | 'EXCLUDED_NON_OPERATING';
  confidence: number;
  reasoning: string;
  isReviewRequired: boolean;
  reviewReason: string | null;
}

type TransactionInput = {
  id: string;
  description: string;
  counterparty: string;
  amount: number;
  method: string;
};

const CLASSIFICATION_PROMPT = (transactions: TransactionInput[]) => `
You are a Senior Accounting Controller specializing in commercial business and restaurant operations.
Classify the following bank transactions into one of these strict categories:
- "REVENUE": Gross customer sales, POS batch deposits, catering payments, delivery payouts (DoorDash, UberEats, Grubhub), gift card deposits.
- "COGS": Direct Cost of Goods Sold — food/beverage inventory (Sysco, US Foods, Butcher, Produce, Bakery), packaging, event food.
- "PAYROLL": Kitchen/FOH hourly wages, manager salaries, payroll taxes (Gusto, ADP).
- "OPERATING_EXPENSE": Rent, utilities, POS software (Toast, 7shifts), insurance, marketing, repairs, cleaning.
- "NON_OPERATING": Balance sheet / non-P&L items — owner distributions, equity draws, loan principal, CapEx, inter-account transfers.

CRITICAL RULES:
1. Owner distributions and equity draws → ALWAYS "NON_OPERATING" with pnlTreatment "EXCLUDED_NON_OPERATING".
2. Loan principal / CapEx → ALWAYS "NON_OPERATING" with pnlTreatment "EXCLUDED_NON_OPERATING".
3. Ambiguous items (platform commissions, unverified large wires) → set isReviewRequired=true, confidence 0.60–0.70.
4. Return ONLY a valid JSON array.

Transactions:
${JSON.stringify(transactions, null, 2)}

Return ONLY a JSON array:
[
  {
    "transactionId": string,
    "category": "REVENUE"|"COGS"|"PAYROLL"|"OPERATING_EXPENSE"|"NON_OPERATING",
    "pnlTreatment": "INCLUDED_IN_PNL"|"EXCLUDED_NON_OPERATING",
    "confidence": number (0.0–1.0),
    "reasoning": string,
    "isReviewRequired": boolean,
    "reviewReason": string | null
  }
]`.trim();

async function parseGeminiClassificationResponse(res: Response): Promise<AiClassificationResult[] | null> {
  if (!res.ok) {
    const errBody = await res.text();
    console.warn('[ClassificationService] Gemini API HTTP error:', res.status, errBody.slice(0, 300));
    return null;
  }

  let json: any;
  try {
    json = await res.json();
  } catch (err: any) {
    console.warn('[ClassificationService] Failed to parse Gemini response as JSON:', err.message);
    return null;
  }

  if (!json || typeof json !== 'object') {
    console.warn('[ClassificationService] Gemini response body is not a JSON object:', json);
    return null;
  }

  if (!Array.isArray(json.candidates) || json.candidates.length === 0) {
    console.warn(
      '[ClassificationService] Gemini returned no candidates.',
      json.promptFeedback ? `promptFeedback=${JSON.stringify(json.promptFeedback)}` : `raw=${JSON.stringify(json).slice(0, 300)}`
    );
    return null;
  }

  const candidate = json.candidates[0];
  if (!candidate) {
    console.warn('[ClassificationService] Gemini candidate[0] is null/undefined');
    return null;
  }

  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
    console.warn(`[ClassificationService] Gemini candidate stopped prematurely: finishReason=${candidate.finishReason}`);
  }

  if (!candidate.content || typeof candidate.content !== 'object') {
    console.warn('[ClassificationService] Gemini candidate missing "content" object:', JSON.stringify(candidate).slice(0, 300));
    return null;
  }

  if (!Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
    console.warn('[ClassificationService] Gemini candidate content missing "parts" array:', JSON.stringify(candidate.content).slice(0, 300));
    return null;
  }

  const firstPart = candidate.content.parts[0];
  if (!firstPart || typeof firstPart.text !== 'string' || firstPart.text.trim().length === 0) {
    console.warn('[ClassificationService] Gemini candidate parts[0] missing valid "text":', JSON.stringify(firstPart).slice(0, 300));
    return null;
  }

  const rawText = firstPart.text.trim();

  try {
    return JSON.parse(rawText) as AiClassificationResult[];
  } catch (parseErr) {
    console.warn(
      '[ClassificationService] Failed to parse Gemini JSON text content:',
      (parseErr as Error).message,
      `Snippet: ${rawText.slice(0, 200)}`
    );
    return null;
  }
}

async function parseOpenAiClassificationResponse(res: Response): Promise<AiClassificationResult[] | null> {
  if (!res.ok) {
    const errBody = await res.text();
    console.warn('[ClassificationService] OpenAI/Ollama API HTTP error:', res.status, errBody.slice(0, 300));
    return null;
  }

  let json: any;
  try {
    json = await res.json();
  } catch (err: any) {
    console.warn('[ClassificationService] Failed to parse OpenAI response as JSON:', err.message);
    return null;
  }

  if (!json || typeof json !== 'object') {
    console.warn('[ClassificationService] OpenAI response body is not a JSON object:', json);
    return null;
  }

  if (!Array.isArray(json.choices) || json.choices.length === 0) {
    console.warn('[ClassificationService] OpenAI returned no choices:', JSON.stringify(json).slice(0, 300));
    return null;
  }

  const choice = json.choices[0];
  if (!choice || !choice.message || typeof choice.message.content !== 'string' || choice.message.content.trim().length === 0) {
    console.warn('[ClassificationService] OpenAI choice[0] missing valid message.content:', JSON.stringify(choice).slice(0, 300));
    return null;
  }

  const content = choice.message.content.trim();

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed)
      ? parsed
      : (parsed.transactions ?? parsed.results ?? null);
  } catch (parseErr) {
    console.warn(
      '[ClassificationService] Failed to parse OpenAI JSON message content:',
      (parseErr as Error).message,
      `Snippet: ${content.slice(0, 200)}`
    );
    return null;
  }
}

/**
 * Sends a batch of transactions to the configured LLM for categorization.
 * Returns null if no LLM is configured or on unrecoverable error.
 * The caller (ingestionService) should fall back to the deterministic rule engine on null.
 */
let quotaExceededUntil = 0;

export async function classifyTransactionBatchWithAi(
  transactions: TransactionInput[]
): Promise<AiClassificationResult[] | null> {
  const config = getAiConfig();
  if (!config.provider || !config.key) return null;

  // Circuit breaker: skip network calls if we recently hit rate limits / quota exhaustion
  if (Date.now() < quotaExceededUntil) {
    return null;
  }

  const prompt = CLASSIFICATION_PROMPT(transactions);

  try {
    if (config.provider === 'gemini') {
      const candidateModels = Array.from(
        new Set([config.model, 'gemini-3.8-flash', 'gemini-3.1-flash-lite'].filter(Boolean))
      );

      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.key}`;
          
          // Strict 6-second timeout so Google never hangs the user's ingestion screen
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          let res: Response;
          try {
            res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
              }),
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timeoutId);
          }

          // Service unavailable (503 / 5xx) or Quota/Rate limit (429):
          // Trip the 60s circuit breaker and return null immediately.
          // Ingestion will seamlessly and instantly finish using the deterministic engine.
          if (res.status === 429 || res.status === 503 || res.status >= 500) {
            console.warn(`[ClassificationService] Gemini unavailable or rate-limited (${res.status}). Tripping 60s circuit breaker to use instant deterministic engine.`);
            quotaExceededUntil = Date.now() + 60_000;
            return null;
          }

          if (res.status === 401 || res.status === 403) {
            console.warn('[ClassificationService] Gemini authentication error (401/403). Tripping 5m circuit breaker.');
            quotaExceededUntil = Date.now() + 300_000;
            return null;
          }

          if (res.status === 404) {
            continue;
          }

          const result = await parseGeminiClassificationResponse(res as any);
          if (result) return result;
        } catch (mErr: any) {
          const isTimeout = mErr.name === 'AbortError' || mErr.message?.includes('aborted');
          if (isTimeout) {
            console.warn(`[ClassificationService] Gemini request timed out (>6s). Tripping 60s circuit breaker to preserve upload speed.`);
            quotaExceededUntil = Date.now() + 60_000;
            return null;
          }
          console.warn(`[ClassificationService] Model ${model} failed:`, mErr.message);
        }
      }
      return null;
    } else {
      // OpenAI or Ollama
      const url = `${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.key}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: 'You are an expert accountant. Respond only with JSON.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });
      return await parseOpenAiClassificationResponse(res as any);
    }
  } catch (err: any) {
    console.warn('[ClassificationService] Network error:', err.message);
    return null;
  }
}
