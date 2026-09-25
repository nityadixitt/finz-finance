import { Router } from 'express';
import { getPnLSummary } from '../controllers/pnlController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.use(optionalAuth);

// GET /api/pnl - Retrieve multi-month calculated P&L statement
router.get('/', getPnLSummary);

export default router;
