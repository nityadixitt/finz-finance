import { Transaction, FinancialCategory } from '../models/Transaction.js';
import { ClassificationCorrection } from '../models/ClassificationCorrection.js';
import { ReviewItem } from '../models/ReviewItem.js';

export interface CorrectCategoryPayload {
  transactionId: string;
  newCategory: FinancialCategory;
  reason?: string;
  includedInPnl?: boolean;
}

export async function correctTransactionCategory(payload: CorrectCategoryPayload): Promise<{
  transaction: Transaction;
  correction: ClassificationCorrection;
}> {
  const { transactionId, newCategory, reason, includedInPnl } = payload;

  const txn = await Transaction.findByPk(transactionId);
  if (!txn) {
    throw new Error(`Transaction with ID '${transactionId}' not found.`);
  }

  const oldCategory = txn.category;

  // 1. Create audit trail record in classification_corrections
  const correction = await ClassificationCorrection.create({
    transaction_id: transactionId,
    old_category: oldCategory,
    new_category: newCategory,
    reason: reason || 'Manual user override via Review / Ledger UI',
  });

  // 2. Update transaction
  txn.category = newCategory;
  txn.confidence = 1.0; // Manual correction is considered 100% verified
  txn.is_review_required = false;
  txn.review_reason = `Manually corrected from ${oldCategory} to ${newCategory}`;
  if (typeof includedInPnl === 'boolean') {
    txn.included_in_pnl = includedInPnl;
  }
  await txn.save();

  // 3. Mark any corresponding ReviewItem as RESOLVED
  await ReviewItem.update(
    {
      status: 'RESOLVED',
      suggested_category: newCategory,
      notes: reason || `Resolved via category correction to ${newCategory}`,
    },
    {
      where: { transaction_id: transactionId },
    }
  );

  return { transaction: txn, correction };
}
