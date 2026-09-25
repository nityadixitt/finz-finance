import { Request, Response, NextFunction } from 'express';
import { getTransactionsList, getTransactionById } from '../services/transactionService.js';
import { correctTransactionCategory } from '../services/correctionService.js';
import { FinancialCategory } from '../models/Transaction.js';

export async function listTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, category, month, reviewOnly, limit, offset, isDemo } = req.query;
    const authUser = (req as any).user;
    
    // Strict tenant isolation: unauthenticated visitors without explicit demo get empty state
    if (!authUser && isDemo !== 'true') {
      return res.json({
        success: true,
        data: { transactions: [], total: 0, limit: 100, offset: 0, hasMore: false },
      });
    }

    const userId = authUser ? authUser.id : 'demo';

    const data = await getTransactionsList({
      userId,
      search: search ? String(search) : undefined,
      category: category ? (String(category) as FinancialCategory) : undefined,
      month: month ? String(month) : undefined,
      reviewOnly: reviewOnly === 'true',
      limit: limit ? parseInt(String(limit), 10) : 100,
      offset: offset ? parseInt(String(offset), 10) : 0,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const txn = await getTransactionById(id);

    if (!txn) {
      return res.status(404).json({
        success: false,
        error: `Transaction with ID '${id}' not found.`,
      });
    }

    res.json({
      success: true,
      data: txn,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTransactionCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { newCategory, reason, includedInPnl } = req.body;

    if (!newCategory) {
      return res.status(400).json({
        success: false,
        error: 'Field "newCategory" is required.',
      });
    }

    const result = await correctTransactionCategory({
      transactionId: id,
      newCategory,
      reason,
      includedInPnl,
    });

    res.json({
      success: true,
      message: `Transaction '${id}' successfully re-categorized to ${newCategory}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
