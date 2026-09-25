import { Router } from 'express';
import { getVarianceReport, getCategoryDrivers } from '../controllers/varianceController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.use(optionalAuth);

// GET /api/variance - Compute MoM variance between two months
router.get('/', getVarianceReport);

// GET /api/variance/drivers/:category - Decompose category variance into vendor drivers
router.get('/drivers/:category', getCategoryDrivers);

export default router;
