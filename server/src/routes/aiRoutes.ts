import { Router } from 'express';
import {
  handleAnalystChat,
  handleBatchClassify,
  handleGetAiStatus,
  handleGetIntelligenceCenter,
  handleGetBriefing,
  handleGetVarianceNarrative,
  handleAnalyzeReview,
} from '../controllers/aiController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.use(optionalAuth);

// GET /api/ai/status - Check configured LLM status
router.get('/status', handleGetAiStatus);

// GET /api/ai/intelligence - Finz Intelligence & Financial Health Center (Bento analytics engine)
router.get('/intelligence', handleGetIntelligenceCenter);

// GET /api/ai/briefing - Native AI CFO Executive Briefing for Dashboard
router.get('/briefing', handleGetBriefing);

// GET /api/ai/variance-narrative - Native AI Root-Cause Diagnostic Bridge
router.get('/variance-narrative', handleGetVarianceNarrative);

// POST /api/ai/review-analysis - Native AI GAAP Analysis for Review Queue
router.post('/review-analysis', handleAnalyzeReview);

// POST /api/ai/chat - Tool-calling conversational AI financial analyst
router.post('/chat', handleAnalystChat);

// POST /api/ai/classify - Batch LLM categorization
router.post('/classify', handleBatchClassify);

export default router;
