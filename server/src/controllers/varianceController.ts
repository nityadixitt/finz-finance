import { Request, Response, NextFunction } from 'express';
import { computeMonthOverMonthVariance, getCategoryVarianceDrivers } from '../services/varianceService.js';
import { FinancialCategory } from '../models/Transaction.js';

export async function getVarianceReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { baseMonth, comparisonMonth, isDemo } = req.query;
    const authUser = (req as any).user;

    // Strict tenant isolation
    if (!authUser && isDemo !== 'true') {
      return res.json({
        success: true,
        data: null,
      });
    }

    const userId = authUser ? authUser.id : 'demo';

    if (!baseMonth || !comparisonMonth) {
      return res.status(400).json({
        success: false,
        error: 'Both baseMonth (e.g. 2026-02) and comparisonMonth (e.g. 2026-03) query parameters are required.',
      });
    }

    const report = await computeMonthOverMonthVariance(
      String(baseMonth),
      String(comparisonMonth),
      userId
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryDrivers(req: Request, res: Response, next: NextFunction) {
  try {
    const { category } = req.params;
    const { baseMonth, comparisonMonth, isDemo } = req.query;
    const authUser = (req as any).user;

    // Strict tenant isolation
    if (!authUser && isDemo !== 'true') {
      return res.json({
        success: true,
        data: [],
      });
    }

    const userId = authUser ? authUser.id : 'demo';

    if (!baseMonth || !comparisonMonth) {
      return res.status(400).json({
        success: false,
        error: 'Both baseMonth (e.g. 2026-02) and comparisonMonth (e.g. 2026-03) query parameters are required.',
      });
    }

    const drivers = await getCategoryVarianceDrivers(
      category as FinancialCategory,
      String(baseMonth),
      String(comparisonMonth),
      userId
    );

    res.json({
      success: true,
      data: drivers,
    });
  } catch (error) {
    next(error);
  }
}
