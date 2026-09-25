import { initDatabase, getSequelize, setDatabaseSynced } from '../config/database.js';
import { User, initUserModel } from './User.js';
import { Category, initCategoryModel, seedStandardCategories } from './Category.js';
import { Transaction, initTransactionModel } from './Transaction.js';
import { ClassificationCorrection, initClassificationCorrectionModel } from './ClassificationCorrection.js';
import { ReviewItem, initReviewItemModel } from './ReviewItem.js';

export { User, Category, Transaction, ClassificationCorrection, ReviewItem };

let modelsInitialized = false;

export function ensureModelsInitialized(force = false) {
  if (modelsInitialized && !force) return;

  initUserModel();
  initCategoryModel();
  initTransactionModel();
  initClassificationCorrectionModel();
  initReviewItemModel();

  // Define Associations
  Transaction.hasMany(ClassificationCorrection, {
    foreignKey: 'transaction_id',
    as: 'corrections',
    onDelete: 'CASCADE',
  });
  ClassificationCorrection.belongsTo(Transaction, {
    foreignKey: 'transaction_id',
    as: 'transaction',
  });

  Transaction.hasMany(ReviewItem, {
    foreignKey: 'transaction_id',
    as: 'reviewItems',
    onDelete: 'CASCADE',
  });
  ReviewItem.belongsTo(Transaction, {
    foreignKey: 'transaction_id',
    as: 'transaction',
  });

  modelsInitialized = true;
}

export async function setupDatabase() {
  // 1. Initialize DB connection
  await initDatabase();

  // 2. Ensure models are bound to the singleton sequelize instance
  ensureModelsInitialized(true);

  // 3. Explicitly synchronize tables (safe CREATE TABLE IF NOT EXISTS)
  const sequelize = getSequelize();
  await sequelize.sync();

  // 4. Pre-seed standard Chart of Accounts
  await seedStandardCategories();

  setDatabaseSynced(true);
  console.log('[Database] General Ledger & User tables synchronized and verified in MySQL.');
}

// Bind models to the singleton instance at module load time
ensureModelsInitialized();
