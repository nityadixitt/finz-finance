import { Request, Response, NextFunction } from 'express';
import { getAiStatus } from '../services/aiConfig.js';
import { classifyTransactionBatchWithAi } from '../services/classificationService.js';
import { runAnalystConversation, ConversationMessage } from '../services/agentService.js';
import {
  generateExecutiveBriefing,
  generateVarianceNarrative,
  analyzeReviewItemWithAi,
} from '../services/briefingService.js';
import { getIntelligenceCenterData } from '../services/intelligenceService.js';
import { Transaction } from '../models/Transaction.js';

// ─── Rate Limiter for AI Chat Endpoint ───────────────────────────────────────
interface RateLimitRecord {
  timestamps: number[];
}

const chatRateLimitStore = new Map<string, RateLimitRecord>();
const CHAT_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const CHAT_RATE_LIMIT_MAX_REQUESTS = 25; // max 25 calls/minute

// Periodic cleanup every 5 minutes to prevent memory leak
setInterval(() => {
  const cutoff = Date.now() - CHAT_RATE_LIMIT_WINDOW_MS;
  for (const [key, record] of chatRateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((t) => t > cutoff);
    if (record.timestamps.length === 0) {
      chatRateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimit(key: string): { allowed: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  const windowStart = now - CHAT_RATE_LIMIT_WINDOW_MS;
  let record = chatRateLimitStore.get(key);

  if (!record) {
    record = { timestamps: [] };
    chatRateLimitStore.set(key, record);
  }

  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= CHAT_RATE_LIMIT_MAX_REQUESTS) {
    const oldest = record.timestamps[0];
    const retryAfterSec = Math.ceil((oldest + CHAT_RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: CHAT_RATE_LIMIT_MAX_REQUESTS - record.timestamps.length,
  };
}

export function handleGetAiStatus(req: Request, res: Response) {
  const status = getAiStatus();
  res.json({
    success: true,
    data: status,
  });
}

export async function handleGetIntelligenceCenter(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as any).user;
    const isDemo = req.query.isDemo === 'true';

    // Strict tenant isolation: unauthenticated visitors without explicit demo get empty state
    if (!authUser && !isDemo) {
      return res.json({ success: true, data: null });
    }

    const userId = authUser ? authUser.id : 'demo';
    const baseMonth = (req.query.baseMonth as string) || '2026-02';
    const comparisonMonth = (req.query.comparisonMonth as string) || '2026-03';

    const data = await getIntelligenceCenterData(userId, baseMonth, comparisonMonth);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function handleGetBriefing(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as any).user;
    const isDemo = req.query.isDemo === 'true';

    // Strict tenant isolation
    if (!authUser && !isDemo) {
      return res.json({ success: true, data: null });
    }

    const userId = authUser ? authUser.id : 'demo';
    const briefing = await generateExecutiveBriefing(userId);
    res.json({ success: true, data: briefing });
  } catch (error) {
    next(error);
  }
}

export async function handleGetVarianceNarrative(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as any).user;
    const isDemo = req.query.isDemo === 'true';

    // Strict tenant isolation
    if (!authUser && !isDemo) {
      return res.json({ success: true, data: null });
    }

    const userId = authUser ? authUser.id : 'demo';
    const baseMonth = (req.query.baseMonth as string) || '2026-02';
    const comparisonMonth = (req.query.comparisonMonth as string) || '2026-03';

    const narrative = await generateVarianceNarrative(baseMonth, comparisonMonth, userId);
    res.json({ success: true, data: narrative });
  } catch (error) {
    next(error);
  }
}

export async function handleAnalyzeReview(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as any).user;
    const isDemo = req.body.isDemo === true;

    // Strict tenant isolation
    if (!authUser && !isDemo) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Data isolation active. You must be signed in or in interactive demo mode.',
      });
    }

    const userId = authUser ? authUser.id : 'demo';
    const { reviewItemId } = req.body;

    if (!reviewItemId || typeof reviewItemId !== 'string') {
      return res.status(400).json({ success: false, error: 'A valid string reviewItemId is required' });
    }

    const analysis = await analyzeReviewItemWithAi(reviewItemId.trim(), userId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
}

export async function handleAnalystChat(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = (req as any).user;
    const { messages, isDemo } = req.body;
    const isDemoMode = isDemo === 'true' || isDemo === true;

    // 1. Data Isolation Guard: If logged out and not explicitly in demo mode, reject immediately
    if (!authUser && !isDemoMode) {
      return res.status(401).json({
        success: false,
        error:
          '🔒 **Data Isolation Active**: You are currently logged out. Please sign in to query your organization\'s financial records, or launch the Interactive Demo workspace to explore sample data.',
      });
    }

    const userId = authUser ? authUser.id : 'demo';

    // 2. Data Isolation Guard: If tenant has zero transactions, never query another user or demo data
    const userTxnCount = await Transaction.count({ where: { user_id: userId } });
    if (userTxnCount === 0) {
      return res.json({
        success: true,
        data: {
          reply: authUser
            ? '🔒 **Data Isolation Active — No Workspace Ledger Data**\n\nYour organization\'s workspace currently has 0 uploaded transactions. Finz AI Copilot strictly enforces multi-tenant data isolation and will never cross-reference or expose another organization\'s ledger entries.\n\nPlease upload your bank or accounting CSV in the **Ledger** view to begin conversational AI variance analysis and financial audits.'
            : '⚠️ **Demo Workspace Not Initialized**\n\nPlease launch the Demo Workspace from the navigation bar or re-seed sample transactions to explore Finz AI Copilot.',
          toolCallsExecuted: [],
        },
      });
    }

    // 3. Rate Limiting Check
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = authUser ? `user:${authUser.id}` : `ip:${clientIp}`;
    const rateCheck = checkRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded. Maximum ${CHAT_RATE_LIMIT_MAX_REQUESTS} AI chat requests per minute allowed. Please retry in ${rateCheck.retryAfterSec} seconds.`,
        retryAfter: rateCheck.retryAfterSec,
      });
    }

    // 4. Input Validation & Schema Integrity
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Field "messages" must be an array of conversation turns.',
      });
    }

    if (messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Conversation history cannot be empty.',
      });
    }

    if (messages.length > 30) {
      return res.status(400).json({
        success: false,
        error: 'Conversation history exceeds maximum allowable length of 30 messages.',
      });
    }

    // 3. Message Level Sanitization & Validation
    const sanitizedMessages: ConversationMessage[] = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg || typeof msg !== 'object') {
        return res.status(400).json({
          success: false,
          error: `Message at index ${i} is not a valid object.`,
        });
      }

      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        return res.status(400).json({
          success: false,
          error: `Message at index ${i} has invalid role "${msg.role}". Must be "user", "assistant", or "system".`,
        });
      }

      if (typeof msg.content !== 'string') {
        return res.status(400).json({
          success: false,
          error: `Message at index ${i} has non-string content.`,
        });
      }

      // Sanitization: strip null bytes and forbidden ASCII control characters
      const cleanContent = msg.content
        .replace(/\0/g, '')
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim();

      if (cleanContent.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Message at index ${i} content is empty or contains only whitespace/control characters.`,
        });
      }

      if (cleanContent.length > 3000) {
        return res.status(400).json({
          success: false,
          error: `Message at index ${i} exceeds maximum character limit of 3,000 characters.`,
        });
      }

      sanitizedMessages.push({
        role: msg.role,
        content: cleanContent,
      });
    }

    const result = await runAnalystConversation(sanitizedMessages, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleBatchClassify(req: Request, res: Response, next: NextFunction) {
  try {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: 'Field "transactions" array is required.',
      });
    }

    if (transactions.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Batch transaction limit exceeded. Maximum 100 transactions per batch.',
      });
    }

    const classifications = await classifyTransactionBatchWithAi(transactions);

    res.json({
      success: true,
      data: classifications,
    });
  } catch (error) {
    next(error);
  }
}
