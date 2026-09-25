import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../config/database.js';

export type FinancialCategory = 'REVENUE' | 'COGS' | 'PAYROLL' | 'OPERATING_EXPENSE' | 'NON_OPERATING';

export interface TransactionAttributes {
  id: string; // from CSV 'Transaction ID'
  user_id?: string | null;
  date: string; // YYYY-MM-DD
  description: string;
  counterparty: string;
  amount: number; // positive = credit/income, negative = debit/expense
  method: string; // UPI, NEFT, ACH, WIRE, CARD, etc.
  category: FinancialCategory;
  confidence: number; // 0.0 - 1.0
  is_review_required: boolean;
  review_reason?: string | null;
  included_in_pnl: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface TransactionCreationAttributes
  extends Optional<TransactionAttributes, 'user_id' | 'is_review_required' | 'confidence' | 'included_in_pnl' | 'created_at' | 'updated_at'> {}

export class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes {
  declare id: string;
  declare user_id: string | null;
  declare date: string;
  declare description: string;
  declare counterparty: string;
  declare amount: number;
  declare method: string;
  declare category: FinancialCategory;
  declare confidence: number;
  declare is_review_required: boolean;
  declare review_reason: string | null;
  declare included_in_pnl: boolean;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

export function initTransactionModel() {
  const sequelize = getSequelize();
  Transaction.init(
    {
      id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      counterparty: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Unknown',
      },
      amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        get() {
          const val = this.getDataValue('amount');
          return val === null ? 0 : parseFloat(val as any);
        },
      },
      method: {
        type: DataTypes.STRING(64),
        allowNull: false,
        defaultValue: 'STANDARD',
      },
      category: {
        type: DataTypes.ENUM('REVENUE', 'COGS', 'PAYROLL', 'OPERATING_EXPENSE', 'NON_OPERATING'),
        allowNull: false,
        defaultValue: 'OPERATING_EXPENSE',
      },
      confidence: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 1.0,
      },
      is_review_required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      review_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      included_in_pnl: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'transactions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['date'] },
        { fields: ['category'] },
        { fields: ['is_review_required'] },
        { fields: ['counterparty'] },
      ],
    }
  );
  return Transaction;
}
