import { Router } from 'express';
import { createCheckoutSession, getSubscriptionStatus, cancelSubscription, handleWebhook } from '../controllers/subscription.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SubscriptionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             hasSubscription:
 *               type: boolean
 *             plan:
 *               type: string
 *               enum: [FREE, PRO]
 *             status:
 *               type: string
 *               enum: [INACTIVE, ACTIVE, CANCELED, PAST_DUE]
 *             currentPeriodStart:
 *               type: string
 *               format: date-time
 *             currentPeriodEnd:
 *               type: string
 *               format: date-time
 */

/**
 * @swagger
 * /subscriptions/create:
 *   post:
 *     summary: Stripe checkout session oluştur
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [PRO]
 *     responses:
 *       200:
 *         description: Checkout session oluşturuldu
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
 *                     sessionId:
 *                       type: string
 *                     url:
 *                       type: string
 *       400:
 *         description: Geçersiz plan veya zaten aktif abonelik
 *       401:
 *         description: Kimlik doğrulama gerekli
 */
router.post('/create', authenticateToken, createCheckoutSession);

/**
 * @swagger
 * /subscriptions/status:
 *   get:
 *     summary: Abonelik durumunu getir
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Abonelik durumu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionResponse'
 *       401:
 *         description: Kimlik doğrulama gerekli
 */
router.get('/status', authenticateToken, getSubscriptionStatus);

/**
 * @swagger
 * /subscriptions/cancel:
 *   post:
 *     summary: Aboneliği iptal et
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Abonelik iptal edildi
 *       404:
 *         description: Aktif abonelik bulunamadı
 *       401:
 *         description: Kimlik doğrulama gerekli
 */
router.post('/cancel', authenticateToken, cancelSubscription);

/**
 * @swagger
 * /stripe/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook başarıyla işlendi
 *       400:
 *         description: Geçersiz webhook signature
 */
router.post('/webhook', handleWebhook);

export default router;
