import { Router } from 'express';
import { handleRegister, handleLogin, handleGetProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register - Detailed registration (FullName, Email, Company, Role, Password)
router.post('/register', handleRegister);

// POST /api/auth/login - Authenticate with email & password, return JWT & Company details
router.post('/login', handleLogin);

// GET /api/auth/me - Return authenticated user session
router.get('/me', requireAuth, handleGetProfile);

export default router;
