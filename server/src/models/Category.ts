import { DataTypes, Model, Optional } from 'sequelize';
import { getSequelize } from '../config/database.js';

export interface CategoryAttributes {
  code: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'NON_OPERATING';
  description: string;
  is_active: boolean;
}

export class Category extends Model<CategoryAttributes> implements CategoryAttributes {
  declare code: string;
  declare name: string;
  declare type: 'INCOME' | 'EXPENSE' | 'NON_OPERATING';
  declare description: string;
  declare is_active: boolean;
}

export function initCategoryModel() {
  const sequelize = getSequelize();
  Category.init(
    {
      code: {
        type: DataTypes.STRING(64),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('INCOME', 'EXPENSE', 'NON_OPERATING'),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'categories',
      timestamps: false,
    }
  );
  return Category;
}

export async function seedStandardCategories() {
  const defaults: CategoryAttributes[] = [
    {
      code: 'REVENUE',
      name: 'Revenue & Gross Inflows',
      type: 'INCOME',
      description: 'Customer contracts, SaaS subscriptions, client invoices, sales settlements',
      is_active: true,
    },
    {
      code: 'COGS',
      name: 'Cost of Goods Sold (COGS)',
      type: 'EXPENSE',
      description: 'Raw materials, component suppliers, packaging, manufacturing, direct freight',
      is_active: true,
    },
    {
      code: 'PAYROLL',
      name: 'Payroll & Staff Salaries',
      type: 'EXPENSE',
      description: 'Employee wages, contractor disbursements, bonuses, benefits',
      is_active: true,
    },
    {
      code: 'OPERATING_EXPENSE',
      name: 'Operating Expenses (OpEx)',
      type: 'EXPENSE',
      description: 'Software subscriptions, cloud infrastructure (AWS), ads, rent, utilities',
      is_active: true,
    },
    {
      code: 'NON_OPERATING',
      name: 'Non-Operating & Balance Sheet Transfers',
      type: 'NON_OPERATING',
      description: 'Inter-account movements, tax advance remittances, owner drawings, loans',
      is_active: true,
    },
  ];

  for (const cat of defaults) {
    await Category.findOrCreate({
      where: { code: cat.code },
      defaults: cat,
    });
  }
}
