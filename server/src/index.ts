import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupDatabase } from './models/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/api', apiRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Finz Finance Deterministic Financial Engine API is running.',
    version: '1.0.0',
    endpoints: {
      transactions: '/api/transactions',
      uploadCsv: '/api/transactions/upload',
      pnl: '/api/pnl',
      variance: '/api/variance',
      reviewQueue: '/api/review',
      seedDemo: '/api/demo/seed',
    },
  });
});

// Global Error Handler
app.use(errorHandler);

async function startServer() {
  try {
    await setupDatabase();
    console.log('[Server] Database setup and migrations completed.');
  } catch (err: any) {
    console.warn(`[Server] Warning: Database connection failed: ${err.message}`);
    console.warn('[Server] Please ensure server/.env has your valid MySQL credentials.');
  }

  app.listen(PORT, () => {
    console.log(`[Server] Finz Finance backend listening on http://localhost:${PORT}`);
  });
}

startServer();
