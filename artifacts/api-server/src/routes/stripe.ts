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

// Buy Spark Tokens (one-time payment, real money in)
router.post('/stripe/token-checkout', async (req, res) => {
  try {
    const { tokens, priceEur, successUrl, cancelUrl } = req.body as {
      tokens: number;
      priceEur: number;
      successUrl: string;
      cancelUrl: string;
    };

    if (!tokens || !priceEur || priceEur < 0.5) {
      res.status(400).json({ error: 'Invalid token package' });
      return;
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(priceEur * 100),
            product_data: {
              name: `Spark ${tokens} Tokens`,
              description: 'Spark Tokens for gifts, unlocks & live sessions',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { type: 'token_purchase', tokens: String(tokens) },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    logger.error({ err }, 'Failed to create token checkout session');
    res.status(500).json({ error: err.message ?? 'Token checkout failed' });
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

// Creator withdrawal — real Stripe Connect transfer + payout to the
// creator's own verified bank account.
router.post('/stripe/withdraw', async (req, res) => {
  try {
    const { amount, connectedAccountId } = req.body as {
      amount: number;
      connectedAccountId: string;
    };

    if (!amount || amount < 1) {
      res.status(400).json({ error: 'Minimum withdrawal is €1' });
      return;
    }
    if (!connectedAccountId) {
      res.status(400).json({ error: 'connectedAccountId is required — complete payout onboarding first' });
      return;
    }

    const stripe = getStripeClient();

    const account = await stripe.accounts.retrieve(connectedAccountId);
    if (!account.payouts_enabled) {
      res.status(400).json({
        error: 'Your payout account is not fully verified yet. Finish onboarding with Stripe before withdrawing.',
      });
      return;
    }

    const PLATFORM_FEE_RATE = 0.10;
    const fee = parseFloat((amount * PLATFORM_FEE_RATE).toFixed(2));
    const netAmount = parseFloat((amount - fee).toFixed(2));

    // Move the creator's 90% share out of the platform's Stripe balance into
    // their connected account. Stripe will then auto-payout to their bank
    // account on their normal payout schedule.
    const transfer = await stripe.transfers.create({
      amount: Math.round(netAmount * 100),
      currency: 'eur',
      destination: connectedAccountId,
      description: `Spark creator withdrawal — gross €${amount.toFixed(2)}, fee €${fee.toFixed(2)}`,
    });

    logger.info({ grossAmount: amount, fee, netAmount, connectedAccountId, transferId: transfer.id }, 'Creator withdrawal transferred');

    res.json({
      success: true,
      grossAmount: amount,
      fee,
      netAmount,
      message: `€${netAmount.toFixed(2)} sent to your Stripe payout account and will arrive in your bank per Stripe's payout schedule.`,
      referenceId: transfer.id,
    });
  } catch (err: any) {
    logger.error({ err }, 'Withdrawal failed');
    res.status(500).json({ error: err.message ?? 'Withdrawal failed' });
  }
});

// Confirm a Checkout Session actually completed payment before crediting
// coins/earnings — avoids granting value on a session the user abandoned.
router.get('/stripe/checkout-session/:id', async (req, res) => {
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    res.json({
      id: session.id,
      paymentStatus: session.payment_status,
      metadata: session.metadata,
    });
  } catch (err: any) {
    logger.error({ err }, 'Failed to retrieve checkout session');
    res.status(500).json({ error: err.message ?? 'Failed to retrieve session' });
  }
});

export default router;
