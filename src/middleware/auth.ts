import { Request, Response, NextFunction } from 'express';
import { storage } from '../server/storage.ts';

export interface AuthUser {
  uid?: string;
  username?: string;
  identifier?: string;
  role: string;
  nama?: string;
  kelas?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const sessionTokenHeader = req.headers['x-session-token'] as string;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split('Bearer ')[1]
    : sessionTokenHeader;

  // Allow kiosk / public attendance terminal requests
  if (token === 'kiosk' || req.headers['x-kiosk-mode'] === 'true') {
    req.user = {
      identifier: 'kiosk',
      username: 'kiosk',
      role: 'guru',
      nama: 'Petugas Gerbang (Kiosk)',
      kelas: '',
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Sesi tidak ditemukan.' });
  }

  try {
    const sess = await storage.findSession(token);
    if (sess) {
      if (new Date(sess.expiresAt) > new Date()) {
        req.user = {
          identifier: sess.identifier,
          username: sess.identifier,
          role: sess.role,
          nama: sess.nama || sess.identifier,
          kelas: sess.kelas || '',
        };
        return next();
      } else {
        return res.status(401).json({ success: false, message: 'Sesi berakhir. Silakan login ulang.' });
      }
    }
  } catch (err) {
    console.warn('Session query lookup error:', err);
  }

  return res.status(401).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa.' });
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = (req.user as any)?.role || 'user';
    if (userRole === 'admin' || allowedRoles.includes(userRole)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Akses Ditolak: Anda tidak memiliki izin.' });
  };
};
