import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const SALT_ROUNDS = 10;

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function generateRefreshToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAccessToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function generate2FASecret(email: string): { secret: string; otpauth_url: string } {
  const secret = speakeasy.generateSecret({
    name: `StudyBuddyAI Admin (${email})`,
    length: 32,
  });
  
  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url || '',
  };
}

export async function generateQRCode(otpauth_url: string): Promise<string> {
  return qrcode.toDataURL(otpauth_url);
}

export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);
  const user = verifyAccessToken(token);

  if (!user) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }

  (req as any).user = user;
  next();
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as AuthUser;
  
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    return;
  }

  next();
}

export function roleMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthUser;
    
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
      return;
    }

    next();
  };
}
