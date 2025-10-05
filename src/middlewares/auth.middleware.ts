import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * JWT token doğrulama middleware'i
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Access token gerekli' 
      });
      return;
    }

    const decoded = verifyAccessToken(token);
    
    // Kullanıcının hala aktif olduğunu kontrol et
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı veya aktif değil' 
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      message: 'Geçersiz token' 
    });
  }
};

/**
 * Admin yetkisi kontrolü
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ 
      success: false, 
      message: 'Admin yetkisi gerekli' 
    });
    return;
  }
  next();
};

/**
 * Pro plan kontrolü
 */
export const requireProPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Kimlik doğrulama gerekli' 
      });
      return;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id }
    });

    if (!subscription || subscription.plan !== 'PRO' || subscription.status !== 'ACTIVE') {
      res.status(403).json({ 
        success: false, 
        message: 'Pro plan gerekli' 
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Abonelik kontrolü sırasında hata oluştu' 
    });
  }
};
