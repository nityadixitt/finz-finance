/**
 * aiAgentService.ts
 * AI Financial Copilot, Executive Briefings, Variance Narratives, and Item Diagnostics.
 */
import { FinancialCategory } from '../types';
import { apiFetch } from './apiClient';

export interface ExecutiveBriefingData {
  headline: string;
  summary: string;
  bulletPoints: string[];
  metrics: {
    revenueGrowthPct: number;
    grossMarginPct: number;
    operatingProfitDelta: number;
    latestMonth: string;
    priorMonth: string;
  };
  keyDriver: {
    counterparty: string;
    delta: number;
    transactionId: string;
    category: string;
  };
  source: 'llm' | 'deterministic_engine';
}

export interface VarianceNarrativeData {
  baseMonth: string;
  comparisonMonth: string;
  headline: string;
  narrative: string;
  topDrivers: Array<{
    category: string;
    counterparty: string;
    impact: 'FAVORABLE' | 'UNFAVORABLE';
    delta: number;
    transactionId: string;
  }>;
  source: 'llm' | 'deterministic_engine';
}

export interface ReviewAnalysisData {
  reviewItemId: string;
  transactionId: string;
  counterparty: string;
  amount: number;
  flagType: string;
  aiVerdict: string;
  gaapStandard: string;
  recommendedCategory: FinancialCategory;
  recommendedIncludedInPnl: boolean;
  confidence: number;
}

export interface AiStatusResponse {
  configured: boolean;
  provider: 'gemini' | 'openai' | 'ollama' | null;
  model: string;
}

export async function sendAnalystChatMessage(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  isDemo?: boolean
): Promise<{ reply: string; toolCallsExecuted: string[] }> {
  return await apiFetch<{ reply: string; toolCallsExecuted: string[] }>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, isDemo }),
  });
}

export async function fetchAiStatus(): Promise<AiStatusResponse> {
  return await apiFetch<AiStatusResponse>('/ai/status');
}

export async function fetchExecutiveBriefing(
  isDemo?: boolean
): Promise<ExecutiveBriefingData> {
  const query = isDemo ? '?isDemo=true' : '';
  return await apiFetch<ExecutiveBriefingData>(`/ai/briefing${query}`);
}

export async function fetchVarianceNarrative(
  baseMonth: string,
  comparisonMonth: string,
  isDemo?: boolean
): Promise<VarianceNarrativeData> {
  const query = new URLSearchParams({ baseMonth, comparisonMonth });
  if (isDemo) query.set('isDemo', 'true');

  return await apiFetch<VarianceNarrativeData>(
    `/ai/variance-narrative?${query.toString()}`
  );
}

export async function fetchReviewAnalysis(
  reviewItemId: string,
  isDemo?: boolean
): Promise<ReviewAnalysisData> {
  return await apiFetch<ReviewAnalysisData>('/ai/review-analysis', {
    method: 'POST',
    body: JSON.stringify({ reviewItemId, isDemo }),
  });
}
