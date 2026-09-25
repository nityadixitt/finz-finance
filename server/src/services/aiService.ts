/**
 * aiService.ts
 *
 * ARCHITECTURAL NOTICE:
 * To satisfy single-responsibility and separation-of-concerns principles,
 * the 800+ line monolith has been decomposed into modular, domain-specific services:
 *
 * 1. aiConfig.ts: LLM provider resolution, runtime .env evaluation, and status checking.
 * 2. classificationService.ts: Batch LLM transaction categorization with strict schema validation.
 * 3. agentService.ts: Tool-calling LLM financial analyst agent over deterministic SQL tools.
 * 4. briefingService.ts: Executive briefings, variance narratives, and review item analysis.
 *
 * This file serves as a re-export barrel for backward compatibility with existing imports.
 */

export {
  getAiConfig,
  getAiStatus,
  type AiConfig,
} from './aiConfig.js';

export {
  classifyTransactionBatchWithAi,
  type AiClassificationResult,
} from './classificationService.js';

export {
  runAnalystConversation,
  type ConversationMessage,
} from './agentService.js';

export {
  generateExecutiveBriefing,
  generateVarianceNarrative,
  analyzeReviewItemWithAi,
  type ExecutiveBriefingResult,
  type VarianceNarrativeResult,
  type ReviewAnalysisResult,
} from './briefingService.js';
