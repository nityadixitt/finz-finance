/**
 * agentService.ts
 * Responsibility: Tool-calling LLM financial analyst agent.
 * Orchestrates multi-turn conversations between the LLM and the deterministic
 * SQL tool layer. All financial numbers come from the DB — the LLM only reasons.
 */
import { getAiConfig } from './aiConfig.js';
import { calculateMonthlyPnL } from './pnlService.js';
import { computeMonthOverMonthVariance, getCategoryVarianceDrivers } from './varianceService.js';
import { getTransactionsList } from './transactionService.js';
import { getReviewItemsList } from './reviewService.js';
import { FinancialCategory } from '../models/Transaction.js';

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const AGENT_TOOLS = [
  {
    name: 'get_monthly_pnl',
    description:
      'Get monthly Income Statement (Revenue, COGS, Gross Profit, Payroll, OpEx, Operating Profit) computed deterministically from verified transactions.',
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'string', description: 'Optional specific month e.g. "2026-03"' },
      },
    },
  },
  {
    name: 'get_variance_analysis',
    description:
      'Compare two monthly P&L statements — absolute and percentage changes, operating profit bridge waterfall.',
    parameters: {
      type: 'object',
      properties: {
        baseMonth: { type: 'string', description: 'Base month e.g. "2026-02"' },
        comparisonMonth: { type: 'string', description: 'Comparison month e.g. "2026-03"' },
      },
      required: ['baseMonth', 'comparisonMonth'],
    },
  },
  {
    name: 'get_variance_drivers',
    description:
      'Break down a category variance into specific vendor/counterparty contributors with exact dollar shifts and transaction IDs.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['REVENUE', 'COGS', 'PAYROLL', 'OPERATING_EXPENSE'],
          description: 'Financial category to decompose',
        },
        baseMonth: { type: 'string', description: 'e.g. "2026-02"' },
        comparisonMonth: { type: 'string', description: 'e.g. "2026-03"' },
      },
      required: ['category', 'baseMonth', 'comparisonMonth'],
    },
  },
  {
    name: 'get_review_queue',
    description:
      'Retrieve pending or flagged transactions requiring controller review or judgment calls.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['PENDING', 'RESOLVED', 'DISMISSED'] },
      },
    },
  },
  {
    name: 'search_transactions',
    description: 'Search raw transactions by keyword, vendor name, category, or transaction ID.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Vendor, description, or TXN ID' },
        category: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
];

const SYSTEM_PROMPT = `You are Finz AI, a Senior Financial Analyst.
You provide accurate, deterministic financial reviews grounded in underlying transaction data.

CRITICAL INSTRUCTIONS:
1. NEVER hallucinate or compute financial totals yourself. Always call the tools to fetch verified numbers.
2. Cite specific transactions as [TXN_ID] — these render as interactive clickable pills in the UI.
3. Be concise and analytical. Highlight margins, cost drivers, and non-operating distinctions.
4. Format all currency in USD with commas (e.g. $412,913.97).
5. If asked what you are: explain you are an AI analyst that queries deterministic SQL tools and provides auditable transaction citations.`;

// ─── Tool Dispatcher ──────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, any>,
  userId: string,
  toolCallsExecuted: string[]
): Promise<any> {
  const cleanName = name.replace(/^.*:/, '');
  toolCallsExecuted.push(cleanName);

  try {
    switch (cleanName) {
      case 'get_monthly_pnl':
        return await calculateMonthlyPnL(args?.month, userId);

      case 'get_variance_analysis':
        return await computeMonthOverMonthVariance(args.baseMonth, args.comparisonMonth, userId);

      case 'get_variance_drivers':
      case 'get_category_drivers':
        return await getCategoryVarianceDrivers(
          args.category as FinancialCategory,
          args.baseMonth,
          args.comparisonMonth,
          userId
        );

      case 'get_review_queue':
        return await getReviewItemsList({ status: args?.status, userId });

      case 'search_transactions':
        return await getTransactionsList({
          userId,
          search: args?.search,
          category: args?.category,
          limit: args?.limit || 20,
        });

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err: any) {
    console.error(`[AgentService] Tool "${cleanName}" threw:`, err.message);
    return { error: err.message };
  }
}

// ─── Gemini Agent ─────────────────────────────────────────────────────────────

/**
 * Verified Gemini models available on v1beta as of late 2025.
 * Listed in preference order: fastest stable → capable fallback.
 */
const GEMINI_MODEL_FALLBACK_CHAIN = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
] as const;

async function runGeminiTurn(
  modelName: string,
  messages: Array<{ role: string; content: string }>,
  executeTool: (name: string, args: any) => Promise<any>,
  apiKey: string
): Promise<{ reply: string; toolCallsExecuted: string[] }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const geminiTools = [
    {
      function_declarations: AGENT_TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    },
  ];

  const contents: any[] = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const toolCallsExecuted: string[] = [];
  let iterations = 0;

  while (iterations < 6) {
    iterations++;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        tools: geminiTools,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 500)}`);
    }

    let json: any;
    try {
      json = await res.json();
    } catch (parseErr: any) {
      console.warn('[AgentService:Gemini] Failed to parse JSON response:', parseErr.message);
      throw new Error(`Failed to parse Gemini response: ${parseErr.message}`);
    }

    // Explicit strict null checks with structured logging at every step
    if (!json || typeof json !== 'object') {
      console.warn('[AgentService:Gemini] Response body is not a JSON object:', json);
      return { reply: 'The model returned an invalid payload. Please try again.', toolCallsExecuted };
    }

    if (!Array.isArray(json.candidates) || json.candidates.length === 0) {
      console.warn(
        '[AgentService:Gemini] No candidates returned by model.',
        json.promptFeedback ? `promptFeedback=${JSON.stringify(json.promptFeedback)}` : `raw=${JSON.stringify(json).slice(0, 400)}`
      );
      return { reply: 'The model returned no candidates. Please refine your question.', toolCallsExecuted };
    }

    const candidate = json.candidates[0];
    if (!candidate) {
      console.warn('[AgentService:Gemini] Candidate[0] is null or undefined.');
      return { reply: 'The model returned an empty candidate. Please try again.', toolCallsExecuted };
    }

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.warn(`[AgentService:Gemini] Model turn finished with status: ${candidate.finishReason}`);
    }

    if (!candidate.content || typeof candidate.content !== 'object') {
      console.warn('[AgentService:Gemini] Candidate is missing content object:', JSON.stringify(candidate).slice(0, 400));
      return { reply: 'The model returned a response with missing content. Please try again.', toolCallsExecuted };
    }

    const parts: any[] = Array.isArray(candidate.content.parts) ? candidate.content.parts : [];
    if (parts.length === 0) {
      const finishReason = candidate.finishReason;
      console.warn(`[AgentService:Gemini] Empty parts array in candidate.content. finishReason=${finishReason}`);
      return { reply: `Response generation stopped (reason: ${finishReason ?? 'unknown'}). Please rephrase.`, toolCallsExecuted };
    }

    const functionCallParts = parts.filter((p: any) => p.functionCall);

    if (functionCallParts.length > 0) {
      // Must push the exact model content to preserve thought_signature tokens
      contents.push(candidate.content);

      const responseParts: any[] = [];
      for (const fcp of functionCallParts) {
        const call = fcp.functionCall;
        const result = await executeTool(call.name, call.args ?? {});
        responseParts.push({
          functionResponse: {
            name: call.name,
            response: { name: call.name, content: result },
          },
        });
      }
      contents.push({ role: 'user', parts: responseParts });
    } else {
      const reply = parts
        .filter((p: any) => !p.thought)
        .map((p: any) => {
          if (typeof p.text !== 'string') {
            console.warn('[AgentService:Gemini] Part missing .text field:', JSON.stringify(p));
            return '';
          }
          return p.text;
        })
        .join('\n')
        .trim();

      return { reply: reply || '(Empty response)', toolCallsExecuted };
    }
  }

  return { reply: 'Max iterations reached. Please ask a more specific question.', toolCallsExecuted };
}

async function executeGeminiAgent(
  messages: Array<{ role: string; content: string }>,
  toolExecutor: (name: string, args: any) => Promise<any>,
  apiKey: string,
  primaryModel: string
): Promise<{ reply: string; toolCallsExecuted: string[] }> {
  // Build fallback chain: primary model first, then verified fallbacks (deduped)
  const chain = Array.from(
    new Set([primaryModel, ...GEMINI_MODEL_FALLBACK_CHAIN])
  );

  let lastError: Error | null = null;

  for (const model of chain) {
    try {
      console.log(`[AgentService:Gemini] Attempting model: ${model}`);
      return await runGeminiTurn(model, messages, toolExecutor, apiKey);
    } catch (err: any) {
      lastError = err;
      const msg: string = err.message ?? '';

      if (msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('no longer available')) {
        console.warn(`[AgentService:Gemini] Model ${model} not found (404), trying next.`);
        continue;
      }
      if (msg.includes('503') || msg.includes('UNAVAILABLE')) {
        console.warn(`[AgentService:Gemini] Model ${model} unavailable (503), retrying once.`);
        await new Promise((r) => setTimeout(r, 1200));
        try {
          return await runGeminiTurn(model, messages, toolExecutor, apiKey);
        } catch {
          continue;
        }
      }
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`[AgentService:Gemini] Model ${model} rate-limited (429), trying next.`);
        continue;
      }

      // Non-recoverable error — don't try other models
      throw err;
    }
  }

  throw lastError ?? new Error('All Gemini model candidates exhausted.');
}

// ─── OpenAI / Ollama Agent ────────────────────────────────────────────────────

async function executeOpenAiAgent(
  messages: Array<{ role: string; content: string }>,
  toolExecutor: (name: string, args: any) => Promise<any>,
  apiKey: string,
  modelName: string,
  baseUrl: string
): Promise<{ reply: string; toolCallsExecuted: string[] }> {
  const url = `${baseUrl}/chat/completions`;

  const openAiTools = AGENT_TOOLS.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));

  const chatMessages: any[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const toolCallsExecuted: string[] = [];
  let iterations = 0;

  while (iterations < 6) {
    iterations++;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: chatMessages,
        tools: openAiTools,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[AgentService:OpenAI] API error:', res.status, errText.slice(0, 500));
      throw new Error(`OpenAI API error (${res.status}): ${errText.slice(0, 400)}`);
    }

    const json: any = await res.json();

    // Explicit null-check with structured logging
    const choice = json?.choices?.[0];
    if (!choice) {
      console.warn('[AgentService:OpenAI] No choices in response. Shape:', JSON.stringify(json).slice(0, 400));
      return { reply: 'The model returned an empty response. Please try again.', toolCallsExecuted };
    }

    const message = choice.message;
    if (!message) {
      console.warn('[AgentService:OpenAI] choice.message is missing:', JSON.stringify(choice));
      return { reply: 'Unexpected API response shape. Please try again.', toolCallsExecuted };
    }

    if (message.tool_calls && message.tool_calls.length > 0) {
      chatMessages.push(message);
      for (const call of message.tool_calls) {
        let args: Record<string, any> = {};
        try {
          args = JSON.parse(call.function.arguments || '{}');
        } catch {
          console.warn('[AgentService:OpenAI] Failed to parse tool arguments:', call.function.arguments);
        }
        const result = await toolExecutor(call.function.name, args);
        chatMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
        toolCallsExecuted.push(call.function.name);
      }
    } else {
      const reply = typeof message.content === 'string' ? message.content : '';
      if (!reply) {
        console.warn('[AgentService:OpenAI] message.content is empty:', JSON.stringify(message));
      }
      return { reply: reply || '(Empty response)', toolCallsExecuted };
    }
  }

  return { reply: 'Max iterations reached. Please ask a more specific question.', toolCallsExecuted };
}

// ─── Public Entry Point ───────────────────────────────────────────────────────

function sanitizeMessageContent(content: string): string {
  if (typeof content !== 'string') return '';
  return content
    .replace(/\0/g, '') // remove null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars (keep newline/tab/carriage return)
    .trim()
    .slice(0, 3000); // cap max message length
}

export type ConversationMessage = { role: 'user' | 'assistant' | 'system'; content: string };

/**
 * Runs a full multi-turn tool-calling conversation with the configured LLM.
 * - If no API key: returns an honest, actionable error message (no fake fallback).
 * - All financial figures come from the deterministic SQL tool layer — LLM only reasons.
 */
export async function runAnalystConversation(
  messages: ConversationMessage[],
  userId: string = 'demo'
): Promise<{ reply: string; toolCallsExecuted: string[] }> {
  // Defensive input sanitization
  const sanitizedMessages = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant' || m.role === 'system'))
    .map((m) => ({
      role: m.role,
      content: sanitizeMessageContent(m.content),
    }))
    .filter((m) => m.content.length > 0);

  if (sanitizedMessages.length === 0) {
    return {
      reply: 'Please provide a valid question or message for financial analysis.',
      toolCallsExecuted: [],
    };
  }

  const config = getAiConfig();

  if (!config.provider || !config.key) {
    return {
      reply: [
        '⚠️ **LLM API Key Required**',
        '',
        'The Finz AI Copilot uses real LLMs (Google Gemini 2.0 Flash or OpenAI GPT-4o-mini) with',
        'function calling over the deterministic SQL engine. No keys are currently configured.',
        '',
        '### To enable:',
        '1. Open `server/.env`',
        '2. Add: `GEMINI_API_KEY=AIzaSy...` or `OPENAI_API_KEY=sk-...`',
        '3. Save and re-submit your message.',
        '',
        'No hardcoded responses are used. The real model will call SQL tools and return verified numbers.',
      ].join('\n'),
      toolCallsExecuted: [],
    };
  }

  const toolCallsExecuted: string[] = [];

  const toolExecutor = (name: string, args: Record<string, any>) =>
    executeTool(name, args, userId, toolCallsExecuted);

  if (config.provider === 'gemini') {
    return await executeGeminiAgent(sanitizedMessages, toolExecutor, config.key, config.model);
  } else {
    return await executeOpenAiAgent(
      sanitizedMessages,
      toolExecutor,
      config.key,
      config.model,
      config.baseUrl || 'https://api.openai.com/v1'
    );
  }
}
