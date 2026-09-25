import { Request, Response, NextFunction } from 'express';
import { seedDemoTransactions, DEMO_CSV_DATA } from '../services/demoDataService.js';

export async function resetAndSeedDemo(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await seedDemoTransactions();
    res.json({
      success: true,
      message: `Demo dataset loaded: ${result.insertedCount} transactions, ${result.reviewedCount} items flagged for review.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export function downloadSampleCsv(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sample_transactions.csv"');
  res.send(DEMO_CSV_DATA);
}
