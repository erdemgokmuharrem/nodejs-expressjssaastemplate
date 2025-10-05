import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Kullanıcının projelerini listele
 */
export const getUserProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
      return;
    }

    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      userId: req.user.id,
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ]
      })
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.project.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Projeler alınırken hata oluştu'
    });
  }
};

/**
 * Proje oluştur
 */
export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
      return;
    }

    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Proje adı gerekli'
      });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        userId: req.user.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Proje başarıyla oluşturuldu',
      data: { project }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Proje oluşturulurken hata oluştu'
    });
  }
};

/**
 * Proje detayını getir
 */
export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
      return;
    }

    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Proje bulunamadı'
      });
      return;
    }

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    console.error('Get project by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Proje bilgileri alınırken hata oluştu'
    });
  }
};

/**
 * Proje güncelle
 */
export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
      return;
    }

    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (name !== undefined && (!name || name.trim().length === 0)) {
      res.status(400).json({
        success: false,
        message: 'Proje adı boş olamaz'
      });
      return;
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Proje bulunamadı'
      });
      return;
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(isActive !== undefined && { isActive })
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Proje başarıyla güncellendi',
      data: { project: updatedProject }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Proje güncellenirken hata oluştu'
    });
  }
};

/**
 * Proje sil
 */
export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
      return;
    }

    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Proje bulunamadı'
      });
      return;
    }

    await prisma.project.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Proje başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Proje silinirken hata oluştu'
    });
  }
};

/**
 * Tüm projeleri listele (Admin only)
 */
export const getAllProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ]
      }),
      ...(userId && { userId: userId as string })
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.project.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Projeler alınırken hata oluştu'
    });
  }
};
