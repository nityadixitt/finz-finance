import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../config/database.js';

export interface ClassificationCorrectionAttributes {
  id: string;
  transaction_id: string;
  old_category: string;
  new_category: string;
  reason?: string | null;
  created_at?: Date;
}

export interface ClassificationCorrectionCreationAttributes
  extends Optional<ClassificationCorrectionAttributes, 'id' | 'reason' | 'created_at'> {}

export class ClassificationCorrection
  extends Model<ClassificationCorrectionAttributes, ClassificationCorrectionCreationAttributes>
  implements ClassificationCorrectionAttributes {
  declare id: string;
  declare transaction_id: string;
  declare old_category: string;
  declare new_category: string;
  declare reason: string | null;

  declare readonly created_at: Date;
}

export function initClassificationCorrectionModel() {
  const sequelize = getSequelize();
  ClassificationCorrection.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      transaction_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      old_category: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      new_category: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'classification_corrections',
      timestamps: true,
      updatedAt: false,
      createdAt: 'created_at',
      indexes: [{ fields: ['transaction_id'] }],
    }
  );
  return ClassificationCorrection;
}
