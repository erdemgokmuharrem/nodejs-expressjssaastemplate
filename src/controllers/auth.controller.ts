import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { generateAccessToken, generateRefreshToken, revokeAllUserRefreshTokens } from '../utils/jwt';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Kullanıcı kaydı
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Email kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kullanılıyor'
      });
      return;
    }

    // Şifre hash'leme
    const hashedPassword = await bcrypt.hash(password, 12);

    // Kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });

    // Free plan subscription oluştur
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'FREE',
        status: 'ACTIVE'
      }
    });

    // Token'ları oluştur
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = await generateRefreshToken(user.id);

    // Hoş geldin emaili gönder
    try {
      await sendWelcomeEmail(user.email, user.firstName || undefined);
    } catch (emailError) {
      console.error('Email gönderme hatası:', emailError);
      // Email hatası kayıt işlemini durdurmaz
    }

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Kayıt sırasında hata oluştu'
    });
  }
};

/**
 * Kullanıcı girişi
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
      return;
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
      return;
    }

    // Token'ları oluştur
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = await generateRefreshToken(user.id);

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          subscription: user.subscription
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Giriş sırasında hata oluştu'
    });
  }
};

/**
 * Token yenileme
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token gerekli'
      });
      return;
    }

    // Refresh token'ı doğrula
    const { verifyRefreshToken } = await import('../utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);

    // Veritabanından refresh token'ı kontrol et
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { id: decoded.tokenId },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date() || !tokenRecord.user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Geçersiz refresh token'
      });
      return;
    }

    // Yeni token'lar oluştur
    const newAccessToken = generateAccessToken({
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role
    });

    const newRefreshToken = await generateRefreshToken(tokenRecord.user.id);

    // Eski refresh token'ı sil
    await prisma.refreshToken.delete({
      where: { id: decoded.tokenId }
    });

    res.json({
      success: true,
      message: 'Token başarıyla yenilendi',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Token yenileme başarısız'
    });
  }
};

/**
 * Şifre sıfırlama talebi
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Güvenlik için kullanıcı bulunamadığında da başarılı mesaj döndür
      res.json({
        success: true,
        message: 'Eğer email adresiniz sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi'
      });
      return;
    }

    // Mevcut reset token'ları sil
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // Yeni reset token oluştur
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        token: 'temp-token', // Will be replaced by actual token
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 saat
      }
    });

    // Email gönder
    await sendPasswordResetEmail(user.email, resetToken.token, user.firstName || undefined);

    res.json({
      success: true,
      message: 'Şifre sıfırlama bağlantısı email adresinize gönderildi'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Şifre sıfırlama talebi sırasında hata oluştu'
    });
  }
};

/**
 * Şifre sıfırlama
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Reset token'ı bul
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken || resetToken.expiresAt < new Date() || resetToken.used) {
      res.status(400).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş token'
      });
      return;
    }

    // Yeni şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 12);

    // Şifreyi güncelle ve token'ı kullanılmış olarak işaretle
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);

    // Kullanıcının tüm refresh token'larını sil (güvenlik için)
    await revokeAllUserRefreshTokens(resetToken.userId);

    res.json({
      success: true,
      message: 'Şifre başarıyla sıfırlandı'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Şifre sıfırlama sırasında hata oluştu'
    });
  }
};

/**
 * Çıkış yapma
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      // Kullanıcının tüm refresh token'larını sil
      await revokeAllUserRefreshTokens(req.user.id);
    }

    res.json({
      success: true,
      message: 'Başarıyla çıkış yapıldı'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Çıkış sırasında hata oluştu'
    });
  }
};

/**
 * Mevcut kullanıcı bilgilerini getir
 */
export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        subscription: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı bilgileri alınırken hata oluştu'
    });
  }
};
