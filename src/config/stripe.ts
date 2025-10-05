import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

// Stripe plan konfigürasyonu
export const STRIPE_PLANS = {
  FREE: {
    priceId: null, // Free plan için price ID yok
    name: 'Free Plan',
    price: 0,
    features: ['Basic features', 'Limited usage']
  },
  PRO: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly', // .env'den alınacak
    name: 'Pro Plan',
    price: 29.99,
    features: ['All features', 'Unlimited usage', 'Priority support']
  }
} as const;

export default stripe;
