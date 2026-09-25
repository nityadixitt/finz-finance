import { Router } from 'express';
import transactionRoutes from './transactionRoutes.js';
import pnlRoutes from './pnlRoutes.js';
import varianceRoutes from './varianceRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import demoRoutes from './demoRoutes.js';
import authRoutes from './authRoutes.js';
import aiRoutes from './aiRoutes.js';
import { isDatabaseConnected, isDatabaseSynced } from '../config/database.js';
import { setupDatabase } from '../models/index.js';

const apiRouter = Router();

// Middleware to ensure database is connected AND synchronized before running queries
apiRouter.use(async (req, res, next) => {
  if (req.path === '/health') return next();
  if (!isDatabaseSynced()) {
    try {
      await setupDatabase();
    } catch (err: any) {
      console.error('[Database Setup Error]:', err);
      return res.status(503).json({
        success: false,
        error: `MySQL Database synchronization failed: ${err.message}. Please verify your credentials in server/.env`,
        isDbError: true,
      });
    }
  }
  next();
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/pnl', pnlRoutes);
apiRouter.use('/variance', varianceRoutes);
apiRouter.use('/review', reviewRoutes);
apiRouter.use('/demo', demoRoutes);
apiRouter.use('/ai', aiRoutes);

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    isDatabaseConnected: isDatabaseConnected(),
    isDatabaseSynced: isDatabaseSynced(),
    timestamp: new Date().toISOString(),
    service: 'Finz Finance Backend',
  });
});

export default apiRouter;
