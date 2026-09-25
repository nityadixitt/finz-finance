/**
 * api.ts
 *
 * ARCHITECTURAL NOTICE:
 * To maintain clean separation of concerns and avoid monolithic service files,
 * the API layer has been decomposed into dedicated domain services:
 *
 * 1. apiClient.ts: Base HTTP fetcher with environment-driven base URL and token injection.
 * 2. authService.ts: User registration, login, and localStorage session management.
 * 3. transactionService.ts: Transaction queries, categorization updates, and CSV ingestion.
 * 4. pnlService.ts: Monthly Profit & Loss (P&L) statements.
 * 5. varianceService.ts: Month-over-month variance analysis and category driver breakdown.
 * 6. reviewService.ts: Controller review queue and exception resolution.
 * 7. demoService.ts: Demo data seeding and sample CSV downloads.
 * 8. intelligenceService.ts: Finz Intelligence Center metrics and risk signals.
 * 9. aiAgentService.ts: Tool-calling LLM AI Copilot, executive briefings, and GAAP diagnostics.
 *
 * This file serves as the unified barrel re-export for complete backward compatibility.
 */

// Base Client & Utilities
export {
  API_BASE_URL,
  apiFetch,
  type ApiResponse,
} from './apiClient';

// Authentication & Session
export {
  getAuthToken,
  getStoredUser,
  storeAuth,
  clearAuth,
  getAuthHeaders,
  registerUser,
  loginUser,
} from './authService';

// Transactions
export {
  fetchTransactions,
  fetchTransactionById,
  updateTransactionCategory,
  uploadCsvFile,
  type FetchTransactionsParams,
} from './transactionService';

// Financial Statements & Variance
export { fetchPnL } from './pnlService';
export {
  fetchVariance,
  fetchCategoryDrivers,
} from './varianceService';

// Review Queue & Exceptions
export {
  fetchReviewQueue,
  resolveReviewItem,
} from './reviewService';

// Demo & Sandboxing
export {
  seedDemoData,
  getSampleCsvDownloadUrl,
} from './demoService';

// Intelligence Center
export { fetchIntelligenceCenter } from './intelligenceService';

// AI Copilot & Automated Analysis
export {
  sendAnalystChatMessage,
  fetchAiStatus,
  fetchExecutiveBriefing,
  fetchVarianceNarrative,
  fetchReviewAnalysis,
  type ExecutiveBriefingData,
  type VarianceNarrativeData,
  type ReviewAnalysisData,
  type AiStatusResponse,
} from './aiAgentService';
