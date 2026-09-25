import { ReviewItem, ReviewStatus } from '../models/ReviewItem.js';
import { Transaction } from '../models/Transaction.js';

export interface ReviewItemFilters {
  status?: ReviewStatus;
  userId?: string;
}

export async function getReviewItemsList(filters?: ReviewItemFilters) {
  const whereClause: any = {
    user_id: filters?.userId || 'demo',
  };
  if (filters?.status) {
    whereClause.status = filters.status;
  }

  const items = await ReviewItem.findAll({
    where: whereClause,
    include: [
      {
        model: Transaction,
        as: 'transaction',
      },
    ],
    order: [['created_at', 'DESC']],
  });

  return items;
}

export async function resolveReviewItem(
  id: string,
  resolution: { status: ReviewStatus; notes?: string }
) {
  const item = await ReviewItem.findByPk(id);
  if (!item) {
    throw new Error(`Review item '${id}' not found.`);
  }

  item.status = resolution.status;
  if (resolution.notes) {
    item.notes = resolution.notes;
  }
  await item.save();

  // If dismissed or resolved, also update transaction review flag
  if (resolution.status === 'RESOLVED' || resolution.status === 'DISMISSED') {
    await Transaction.update(
      { is_review_required: false },
      { where: { id: item.transaction_id } }
    );
  }

  return item;
}
