import { Router, type IRouter } from 'express';
import { getStripeClient } from '../stripeClient';
import { logger } from '../lib/logger';

const router: IRouter = Router();

// Create a Stripe Checkout Session (redirects to hosted Stripe page)
router.post('/stripe/checkout-session', async (req, res) => {
  try {
    const {
      amount,
      currency = 'usd',
      coachName,
      sessionLabel,
      successUrl,
      cancelUrl,
      metadata = {},
    } = req.body as {
      amount: number;
      currency?: string;
      coachName: string;
      sessionLabel: string;
      successUrl: string;
      cancelUrl: string;
      metadata?: Record<string, string>;
    };

    if (!amount || amount < 50) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: `${sessionLabel} with ${coachName}`,
              description: 'Dating coach session on Spark',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    logger.error({ err }, 'Failed to create checkout session');
    res.status(500).json({ error: err.message ?? 'Checkout failed' });
  }
});

// Create a Stripe Subscription Checkout (€1/month)
router.post('/stripe/subscription-checkout', async (req, res) => {
  try {
    const { successUrl, cancelUrl } = req.body as {
      successUrl: string;
      cancelUrl: string;
    };

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: 100, // €1.00
            product_data: {
              name: 'Spark Premium',
              description: 'Full access to Spark — matches, chat, video calls & coaching.',
            },
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    logger.error({ err }, 'Failed to create subscription checkout');
    res.status(500).json({ error: err.message ?? 'Subscription checkout failed' });
  }
});

// Unlock a creator's locked photo (one-time payment)
router.post('/stripe/unlock-photo', async (req, res) => {
  try {
    const { photoId, profileName, price, currency = 'eur', successUrl, cancelUrl } = req.body as {
      photoId: string;
      profileName: string;
      price: number;
      currency?: string;
      successUrl: string;
      cancelUrl: string;
    };

    if (!price || price < 50) {
      res.status(400).json({ error: 'Invalid price' });
      return;
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency,
          unit_amount: price,
          product_data: {
            name: `Unlock photo · ${profileName}`,
            description: 'One-time unlock of exclusive content on Spark',
          },
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { photoId, profileName },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    logger.error({ err }, 'Failed to create unlock-photo session');
    res.status(500).json({ error: err.message ?? 'Unlock failed' });
  }
});

export default router;
