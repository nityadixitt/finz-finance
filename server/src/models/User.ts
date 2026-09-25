import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../config/database.js';

export type UserRole = 'CFO' | 'CONTROLLER' | 'FINANCIAL_ANALYST' | 'AUDITOR';

export interface UserAttributes {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  company_name: string;
  role: UserRole;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'role' | 'created_at' | 'updated_at'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare full_name: string;
  declare email: string;
  declare password_hash: string;
  declare company_name: string;
  declare role: UserRole;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

export function initUserModel() {
  const sequelize = getSequelize();
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      full_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      company_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'My Company',
      },
      role: {
        type: DataTypes.ENUM('CFO', 'CONTROLLER', 'FINANCIAL_ANALYST', 'AUDITOR'),
        allowNull: false,
        defaultValue: 'CFO',
      },
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return User;
}
