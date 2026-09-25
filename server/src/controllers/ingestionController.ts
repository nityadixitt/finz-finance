import { Request, Response, NextFunction } from 'express';
import { ingestCsvContent } from '../services/ingestionService.js';

export async function uploadTransactionsCsv(req: Request, res: Response, next: NextFunction) {
  try {
    let csvData = '';

    if (req.file) {
      csvData = req.file.buffer.toString('utf-8');
    } else if (req.body && req.body.csvString) {
      csvData = req.body.csvString;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No CSV file or csvString provided. Please upload a CSV file with multipart/form-data.',
      });
    }

    const authUser = (req as any).user;
    const userId = authUser ? authUser.id : 'demo';

    const result = await ingestCsvContent(csvData, userId);

    res.json({
      success: true,
      message: `Successfully processed ${result.insertedCount} transactions. ${result.reviewedCount} transactions flagged for review.`,
      data: {
        insertedCount: result.insertedCount,
        reviewedCount: result.reviewedCount,
      },
    });
  } catch (error) {
    next(error);
  }
}
