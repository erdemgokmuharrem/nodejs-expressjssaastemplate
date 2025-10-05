import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Tüm kullanıcıları listele (Admin only)
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search ? {
      OR: [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          subscription: {
            select: {
              plan: true,
              status: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar alınırken hata oluştu'
    });
  }
};

/**
 * Kullanıcı detayını getir
 */
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true
          }
        }
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
    console.error('Get user by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı bilgileri alınırken hata oluştu'
    });
  }
};

/**
 * Kullanıcı profilini güncelle
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
      return;
    }

    const { firstName, lastName } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Profil güncellenirken hata oluştu'
    });
  }
};

/**
 * Şifre değiştir
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Mevcut kullanıcıyı al
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
      return;
    }

    // Mevcut şifreyi kontrol et
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Mevcut şifre yanlış'
      });
      return;
    }

    // Yeni şifreyi hash'le ve güncelle
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Şifre değiştirilirken hata oluştu'
    });
  }
};

/**
 * Kullanıcıyı güncelle (Admin only)
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        role,
        isActive
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı güncellenirken hata oluştu'
    });
  }
};

/**
 * Kullanıcıyı sil (Admin only)
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Kendi hesabını silmeye çalışıyorsa engelle
    if (req.user && req.user.id === id) {
      res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı silemezsiniz'
      });
      return;
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı silinirken hata oluştu'
    });
  }
};

/**
 * Hesabı sil (kendi hesabını sil)
 */
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
      return;
    }

    await prisma.user.delete({
      where: { id: req.user.id }
    });

    res.json({
      success: true,
      message: 'Hesabınız başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Hesap silinirken hata oluştu'
    });
  }
};
