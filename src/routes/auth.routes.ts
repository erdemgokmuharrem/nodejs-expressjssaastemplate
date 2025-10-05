import { Router } from 'express';
import { register, login, refresh, forgotPassword, resetPassword, logout, me } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
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
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             accessToken:
 *               type: string
 *             refreshToken:
 *               type: string
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Kullanıcı kaydı
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Geçersiz veri veya email zaten kullanılıyor
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Kullanıcı girişi
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Giriş başarılı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Geçersiz email veya şifre
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Token yenileme
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token başarıyla yenilendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Geçersiz refresh token
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Şifre sıfırlama talebi
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Şifre sıfırlama bağlantısı gönderildi
 *       500:
 *         description: Sunucu hatası
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Şifre sıfırlama
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Şifre başarıyla sıfırlandı
 *       400:
 *         description: Geçersiz veya süresi dolmuş token
 */
router.post('/reset-password/:token', resetPassword);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Çıkış yapma
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarıyla çıkış yapıldı
 *       401:
 *         description: Kimlik doğrulama gerekli
 */
router.post('/logout', authenticateToken, logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Mevcut kullanıcı bilgileri
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı bilgileri
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
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Kimlik doğrulama gerekli
 */
router.get('/me', authenticateToken, me);

export default router;
