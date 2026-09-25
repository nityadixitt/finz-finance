import { Request, Response, NextFunction } from 'express';
import { getReviewItemsList, resolveReviewItem } from '../services/reviewService.js';
import { ReviewStatus } from '../models/ReviewItem.js';

export async function listReviewItems(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, isDemo } = req.query;
    const authUser = (req as any).user;

    // Strict tenant isolation
    if (!authUser && isDemo !== 'true') {
      return res.json({
        success: true,
        data: [],
      });
    }

    const userId = authUser ? authUser.id : 'demo';

    const items = await getReviewItemsList({
      status: status ? (String(status) as ReviewStatus) : undefined,
      userId,
    });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateReviewStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Field "status" (RESOLVED or DISMISSED) is required.',
      });
    }

    const item = await resolveReviewItem(id, { status, notes });

    res.json({
      success: true,
      message: `Review item '${id}' marked as ${status}.`,
      data: item,
    });
  } catch (error) {
    next(error);
  }
}
