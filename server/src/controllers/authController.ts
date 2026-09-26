import { Request, Response, NextFunction } from 'express';
import { registerNewUser, loginUser, getUserProfile } from '../services/authService.js';

export async function handleRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, email, password, companyName, role, industry } = req.body;

    const user = await registerNewUser({
      fullName,
      email,
      password,
      companyName,
      role,
      industry,
    });

    res.status(201).json({
      success: true,
      message: 'Account successfully registered! Please sign in with your credentials.',
      data: { user, ...user },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const result = await loginUser({ email, password });

    res.json({
      success: true,
      message: `Welcome back, ${result.user.fullName}!`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await getUserProfile(userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
