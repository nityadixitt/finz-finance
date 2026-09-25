import { Router } from 'express';
import { resetAndSeedDemo, downloadSampleCsv } from '../controllers/demoController.js';

const router = Router();

// POST /api/demo/seed - Seed realistic 3-month dataset
router.post('/seed', resetAndSeedDemo);

// GET /api/demo/sample-csv - Download sample CSV file
router.get('/sample-csv', downloadSampleCsv);

export default router;
