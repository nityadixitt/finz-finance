import { Op } from 'sequelize';
import { Transaction, FinancialCategory } from '../models/Transaction.js';
import { ClassificationCorrection } from '../models/ClassificationCorrection.js';

export interface TransactionFilterOptions {
  userId?: string;
  search?: string;
  category?: FinancialCategory;
  month?: string; // YYYY-MM
  reviewOnly?: boolean;
  limit?: number;
  offset?: number;
}

export async function getTransactionsList(options: TransactionFilterOptions = {}) {
  const where: any = {
    user_id: options.userId || 'demo',
  };

  if (options.category) {
    where.category = options.category;
  }

  if (options.month) {
    where.date = {
      [Op.startsWith]: options.month,
    };
  }

  if (options.reviewOnly) {
    where.is_review_required = true;
  }

  if (options.search) {
    const s = `%${options.search}%`;
    where[Op.or] = [
      { id: { [Op.like]: s } },
      { description: { [Op.like]: s } },
      { counterparty: { [Op.like]: s } },
      { method: { [Op.like]: s } },
    ];
  }

  const { rows, count } = await Transaction.findAndCountAll({
    where,
    include: [
      {
        model: ClassificationCorrection,
        as: 'corrections',
      },
    ],
    order: [['date', 'DESC'], ['created_at', 'DESC']],
    limit: options.limit || 100,
    offset: options.offset || 0,
  });

  return {
    transactions: rows,
    totalCount: count,
  };
}

export async function getTransactionById(id: string) {
  if (!id) return null;

  // 1. Direct Primary Key lookup
  let txn = await Transaction.findByPk(id, {
    include: [{ model: ClassificationCorrection, as: 'corrections' }],
  });
  if (txn) return txn;

  // 2. If ID has "TXN_" or "TXN-" prefix, try stripping it (e.g. "TXN_1179" -> "1179")
  const stripped = id.replace(/^\[?TXN[_-]/i, '').replace(/\]?$/, '').trim();
  if (stripped && stripped !== id) {
    txn = await Transaction.findByPk(stripped, {
      include: [{ model: ClassificationCorrection, as: 'corrections' }],
    });
    if (txn) return txn;
  }

  // 3. If ID didn't have "TXN_" prefix, try prepending "TXN_" or "txn_"
  if (!id.toUpperCase().startsWith('TXN_')) {
    txn = await Transaction.findByPk(`TXN_${id}`, {
      include: [{ model: ClassificationCorrection, as: 'corrections' }],
    });
    if (txn) return txn;

    txn = await Transaction.findByPk(`txn_${id}`, {
      include: [{ model: ClassificationCorrection, as: 'corrections' }],
    });
    if (txn) return txn;
  }

  // 4. Case-insensitive or partial ID search
  txn = await Transaction.findOne({
    where: {
      [Op.or]: [
        { id: { [Op.like]: `%${stripped}%` } },
        { id: { [Op.like]: `%${id}%` } },
      ],
    },
    include: [{ model: ClassificationCorrection, as: 'corrections' }],
  });

  return txn;
}
