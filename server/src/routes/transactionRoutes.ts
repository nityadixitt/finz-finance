import { Router } from 'express';
import {
  listTransactions,
  getTransaction,
  updateTransactionCategory,
} from '../controllers/transactionController.js';
import { uploadTransactionsCsv } from '../controllers/ingestionController.js';
import { uploadCsv } from '../middleware/upload.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.use(optionalAuth);

// GET /api/transactions - List all transactions with filters
router.get('/', listTransactions);

// POST /api/transactions/upload - Ingest CSV
router.post('/upload', uploadCsv.single('file'), uploadTransactionsCsv);

// GET /api/transactions/:id - Get single transaction
router.get('/:id', getTransaction);

// PATCH /api/transactions/:id/category - Manually correct category & update audit trail
router.patch('/:id/category', updateTransactionCategory);

export default router;
