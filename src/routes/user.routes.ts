import { Router } from 'express';
import { getAllUsers, getUserById, updateProfile, changePassword, updateUser, deleteUser, deleteAccount } from '../controllers/user.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         subscription:
 *           type: object
 *           properties:
 *             plan:
 *               type: string
 *               enum: [FREE, PRO]
 *             status:
 *               type: string
 *               enum: [INACTIVE, ACTIVE, CANCELED, PAST_DUE]
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Tüm kullanıcıları listele (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kullanıcı listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserProfile'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Admin yetkisi gerekli
 */
router.get('/', authenticateToken, requireAdmin, getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Kullanıcı detayını getir
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kullanıcı detayı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.get('/:id', authenticateToken, getUserById);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Kullanıcı profilini güncelle
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil başarıyla güncellendi
 *       401:
 *         description: Kimlik doğrulama gerekli
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Şifre değiştir
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Şifre başarıyla değiştirildi
 *       400:
 *         description: Mevcut şifre yanlış
 *       401:
 *         description: Kimlik doğrulama gerekli
 */
router.put('/change-password', authenticateToken, changePassword);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Kullanıcıyı güncelle (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla güncellendi
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Admin yetkisi gerekli
 */
router.put('/:id', authenticateToken, requireAdmin, updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Kullanıcıyı sil (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla silindi
 *       400:
 *         description: Kendi hesabınızı silemezsiniz
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       403:
 *         description: Admin yetkisi gerekli
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

/**
 * @swagger
 * /users/account:
 *   delete:
 *     summary: Hesabı sil (kendi hesabını sil)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hesap başarıyla silindi
 *       401:
 *         description: Kimlik doğrulama gerekli
 */
router.delete('/account', authenticateToken, deleteAccount);

export default router;
