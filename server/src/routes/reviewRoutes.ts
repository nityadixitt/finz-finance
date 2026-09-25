import { Router } from 'express';
import { listReviewItems, updateReviewStatus } from '../controllers/reviewController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.use(optionalAuth);

// GET /api/review - Get items requiring review
router.get('/', listReviewItems);

// PATCH /api/review/:id - Resolve or dismiss a review item
router.patch('/:id', updateReviewStatus);

export default router;
