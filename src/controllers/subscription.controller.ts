import { Request, Response } from 'express';
import { stripe, STRIPE_PLANS } from '../config/stripe';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Stripe checkout session oluştur
 */
export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
      return;
    }

    const { plan } = req.body;

    if (!plan || !STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS]) {
      res.status(400).json({
        success: false,
        message: 'Geçersiz plan seçimi'
      });
      return;
    }

    const selectedPlan = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];

    // Kullanıcının mevcut subscription'ını kontrol et
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id }
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      res.status(400).json({
        success: false,
        message: 'Zaten aktif bir aboneliğiniz var'
      });
      return;
    }

    // Stripe customer oluştur veya mevcut customer'ı al
    let stripeCustomerId = existingSubscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: req.user.id
        }
      });
      stripeCustomerId = customer.id;
    }

    // Checkout session oluştur
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.priceId!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        userId: req.user.id,
        plan: plan
      }
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Checkout session oluşturulurken hata oluştu'
    });
  }
};

/**
 * Abonelik durumunu getir
 */
export const getSubscriptionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
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

    if (!subscription) {
      res.json({
        success: true,
        data: {
          hasSubscription: false,
          plan: 'FREE',
          status: 'INACTIVE'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        hasSubscription: true,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Abonelik durumu alınırken hata oluştu'
    });
  }
};

/**
 * Aboneliği iptal et
 */
export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
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

    if (!subscription || !subscription.stripeSubscriptionId) {
      res.status(404).json({
        success: false,
        message: 'Aktif abonelik bulunamadı'
      });
      return;
    }

    // Stripe'da aboneliği iptal et
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Veritabanında durumu güncelle
    await prisma.subscription.update({
      where: { userId: req.user.id },
      data: { status: 'CANCELED' }
    });

    res.json({
      success: true,
      message: 'Abonelik iptal edildi. Mevcut dönem sonunda geçerli olacak.'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Abonelik iptal edilirken hata oluştu'
    });
  }
};

/**
 * Stripe webhook handler
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).json({
        success: false,
        message: 'Webhook signature verification failed'
      });
      return;
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook işlenirken hata oluştu'
    });
  }
};

// Webhook event handlers
const handleCheckoutSessionCompleted = async (session: any): Promise<void> => {
  const userId = session.metadata.userId;
  const plan = session.metadata.plan;

  if (userId && plan) {
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        stripeCustomerId: session.customer,
        plan: plan.toUpperCase(),
        status: 'ACTIVE'
      },
      create: {
        userId,
        stripeCustomerId: session.customer,
        plan: plan.toUpperCase(),
        status: 'ACTIVE'
      }
    });
  }
};

const handleSubscriptionCreated = async (subscription: any): Promise<void> => {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;

  const user = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (user) {
    await prisma.subscription.update({
      where: { userId: user.userId },
      data: {
        stripeSubscriptionId: subscriptionId,
        status: 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  }
};

const handleSubscriptionUpdated = async (subscription: any): Promise<void> => {
  const subscriptionId = subscription.id;
  const status = subscription.status;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });
};

const handleSubscriptionDeleted = async (subscription: any): Promise<void> => {
  const subscriptionId = subscription.id;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: 'CANCELED'
    }
  });
};

const handlePaymentSucceeded = async (invoice: any): Promise<void> => {
  const subscriptionId = invoice.subscription;

  if (subscriptionId) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: 'ACTIVE' }
    });
  }
};

const handlePaymentFailed = async (invoice: any): Promise<void> => {
  const subscriptionId = invoice.subscription;

  if (subscriptionId) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: 'PAST_DUE' }
    });
  }
};
