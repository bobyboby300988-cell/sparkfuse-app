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

export default router;
