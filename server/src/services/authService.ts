import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'finz_finance_secure_jwt_secret_token_2026';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  role?: UserRole;
  industry?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerNewUser(payload: RegisterPayload) {
  const { fullName, email, password, companyName, role } = payload;

  if (!email || !password || !fullName || !companyName) {
    throw new Error('Full Name, Email, Company Name, and Password are required.');
  }

  // Check if email already exists
  const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existingUser) {
    throw new Error(`An account with email '${email}' already exists. Please sign in.`);
  }

  // Hash password with bcrypt
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create User with company_name directly on record
  const user = await User.create({
    full_name: fullName.trim(),
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    company_name: companyName.trim(),
    role: role || 'CFO',
  });

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    companyName: user.company_name,
  };
}

export async function loginUser(payload: LoginPayload) {
  const { email, password } = payload;

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      companyName: user.company_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      companyName: user.company_name,
    },
  };
}

export async function getUserProfile(userId: string) {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password_hash'] },
  });
  if (!user) {
    throw new Error('User not found.');
  }
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    companyName: user.company_name,
  };
}
