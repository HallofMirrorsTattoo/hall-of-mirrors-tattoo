import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      artist?: {
        id: string;
        email: string;
        full_name: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('FATAL: JWT_SECRET is not set. Refusing to verify tokens.');
      return res.status(500).json({ success: false, error: 'Server misconfigured' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = jwt.verify(token, secret) as any;

    // Attach artist data to request
    req.artist = {
      id: decoded.id,
      email: decoded.email,
      full_name: decoded.full_name,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
}

/**
 * Restricts an endpoint to the studio owner (Robyn). Apply after authMiddleware.
 * Owner email comes from STUDIO_OWNER_EMAIL env var, falling back to the seeded
 * Robyn address so dev environments keep working.
 */
export function ownerOnly(req: Request, res: Response, next: NextFunction) {
  const ownerEmail = (process.env.STUDIO_OWNER_EMAIL || 'robyn@hallofmirrorstattoo.com').toLowerCase();
  if (!req.artist || req.artist.email.toLowerCase() !== ownerEmail) {
    return res.status(403).json({ success: false, error: 'Only the studio owner can change these settings' });
  }
  next();
}
