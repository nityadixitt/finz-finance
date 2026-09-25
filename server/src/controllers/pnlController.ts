import { Request, Response, NextFunction } from 'express';
import { calculateMonthlyPnL } from '../services/pnlService.js';

export async function getPnLSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { month, isDemo } = req.query;
    const authUser = (req as any).user;

    // Strict tenant isolation: unauthenticated visitors without explicit demo get empty state
    if (!authUser && isDemo !== 'true') {
      return res.json({
        success: true,
        data: {
          months: [],
          statements: [],
          totals: {
            totalRevenue: 0,
            totalCogs: 0,
            totalGrossProfit: 0,
            totalPayroll: 0,
            totalOperatingExpenses: 0,
            totalOperatingProfit: 0,
          },
        },
      });
    }

    const userId = authUser ? authUser.id : 'demo';

    const summary = await calculateMonthlyPnL(month ? String(month) : undefined, userId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}
