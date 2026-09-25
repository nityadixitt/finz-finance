import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../config/database.js';

export type ReviewStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface ReviewItemAttributes {
  id: string;
  user_id?: string | null;
  transaction_id: string;
  flag_type: string; // LOW_CONFIDENCE, UNUSUAL_AMOUNT, AMBIGUOUS_TRANSFER, DUPLICATE_RISK, NON_PNL_TREATMENT
  status: ReviewStatus;
  suggested_category: string;
  confidence: number;
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ReviewItemCreationAttributes
  extends Optional<ReviewItemAttributes, 'id' | 'user_id' | 'status' | 'notes' | 'created_at' | 'updated_at'> {}

export class ReviewItem
  extends Model<ReviewItemAttributes, ReviewItemCreationAttributes>
  implements ReviewItemAttributes {
  declare id: string;
  declare user_id: string | null;
  declare transaction_id: string;
  declare flag_type: string;
  declare status: ReviewStatus;
  declare suggested_category: string;
  declare confidence: number;
  declare notes: string | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

export function initReviewItemModel() {
  const sequelize = getSequelize();
  ReviewItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      transaction_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      flag_type: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'RESOLVED', 'DISMISSED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      suggested_category: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      confidence: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'review_items',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['transaction_id'] },
        { fields: ['status'] },
        { fields: ['flag_type'] },
      ],
    }
  );
  return ReviewItem;
}
