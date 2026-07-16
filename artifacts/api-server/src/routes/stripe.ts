import { Router, type IRouter } from 'express';
import { eq, sql } from 'drizzle-orm';
import Stripe from 'stripe';
import { getStripeClient } from '../stripeClient';
import { logger } from '../lib/logger';
import { db, usersTable } from '@workspace/db';
import { requireAuth } from '../middlewares/requireAuth';
import { ensureDbUser } from '../lib/jitUser';

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

// Create a Stripe Subscription Checkout (€2/month)
router.post('/stripe/subscription-checkout', requireAuth, async (req, res) => {
  try {
    const { successUrl, cancelUrl } = req.body as {
      successUrl: string;
      cancelUrl: string;
    };

    const userId = req.auth!.userId;
    // Ensure the user record exists in DB so webhook can find them
    await ensureDbUser(userId);

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: 200, // €2.00
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
      metadata: { userId },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    logger.error({ err }, 'Failed to create subscription checkout');
    res.status(500).json({ error: err.message ?? 'Subscription checkout failed' });
  }
});

// Buy Spark Tokens (one-time payment, real money in)
router.post('/stripe/token-checkout', requireAuth, async (req, res) => {
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

    const userId = req.auth!.userId;
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
      metadata: { type: 'token_purchase', tokens: String(tokens), userId },
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

    // Platform retains 15% of gross earnings at withdrawal; receiver keeps 85%.
    const PLATFORM_FEE_RATE = 0.15;
    const fee = parseFloat((amount * PLATFORM_FEE_RATE).toFixed(2));
    const netAmount = parseFloat((amount - fee).toFixed(2));

    // Move the user's 85% share out of the platform's Stripe balance into
    // their connected account. Stripe will then auto-payout to their bank
    // account on their normal payout schedule.
    const transfer = await stripe.transfers.create({
      amount: Math.round(netAmount * 100),
      currency: 'eur',
      destination: connectedAccountId,
      description: `SparkFuse withdrawal — gross €${amount.toFixed(2)}, platform fee 15% €${fee.toFixed(2)}`,
    });

    logger.info({ grossAmount: amount, fee, netAmount, connectedAccountId, transferId: transfer.id }, 'Withdrawal transferred');

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

// ── Stripe Webhook ─────────────────────────────────────────────────────────
// Automatically blocks access when a monthly payment fails or subscription is
// cancelled. Stripe sends events here; we update isSubscribed in the DB.
// Setup: add this URL in Stripe Dashboard → Webhooks:
//   https://<your-domain>/api/stripe/webhook
// Events to enable: checkout.session.completed, invoice.payment_succeeded,
//   invoice.payment_failed, customer.subscription.deleted,
//   customer.subscription.updated
router.post('/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.warn('STRIPE_WEBHOOK_SECRET not configured — webhook skipped');
    res.status(400).json({ error: 'Webhook secret not configured' });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err: any) {
    logger.error({ err }, 'Stripe webhook signature invalid');
    res.status(400).json({ error: `Webhook error: ${err.message}` });
    return;
  }

  try {
    const stripe = getStripeClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // One-time token purchase
        if (session.mode === 'payment' && session.metadata?.type === 'token_purchase') {
          const tokens = parseInt(session.metadata.tokens ?? '0', 10);
          const userId = session.metadata.userId;
          if (tokens > 0 && userId) {
            await db.update(usersTable).set({
              coinBalance: sql`${usersTable.coinBalance} + ${tokens}`,
            }).where(eq(usersTable.id, userId));
            logger.info({ userId, tokens }, 'Coins credited via Stripe webhook');
          }
          break;
        }

        if (session.mode !== 'subscription' || !session.subscription || !session.customer) break;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : (session.subscription as Stripe.Subscription).id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const subData = {
          isSubscribed: true,
          subscribedAt: new Date(),
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: subscription.status,
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        };
        // Prefer userId from metadata (most reliable); fall back to email match
        const metaUserId = session.metadata?.userId;
        if (metaUserId) {
          // Ensure user exists in DB before updating (handles new registrants)
          await ensureDbUser(metaUserId);
          await db.update(usersTable).set(subData).where(eq(usersTable.id, metaUserId));
          logger.info({ userId: metaUserId, customerId }, 'Subscription activated via webhook (userId)');
        } else {
          const customer = await stripe.customers.retrieve(customerId);
          if ((customer as Stripe.DeletedCustomer).deleted) break;
          const email = (customer as Stripe.Customer).email;
          if (!email) break;
          await db.update(usersTable).set(subData).where(eq(usersTable.email, email));
          logger.info({ email, customerId }, 'Subscription activated via webhook (email)');
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription || !invoice.customer) break;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as Stripe.Customer).id;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription as Stripe.Subscription).id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await db.update(usersTable).set({
          isSubscribed: true,
          subscriptionStatus: 'active',
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        }).where(eq(usersTable.stripeCustomerId, customerId));
        logger.info({ customerId }, 'Subscription renewed via webhook');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.customer) break;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as Stripe.Customer).id;
        await db.update(usersTable).set({
          isSubscribed: false,
          subscriptionStatus: 'past_due',
        }).where(eq(usersTable.stripeCustomerId, customerId));
        logger.info({ customerId }, 'Subscription payment failed — access blocked');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as Stripe.Customer).id;
        await db.update(usersTable).set({
          isSubscribed: false,
          subscriptionStatus: 'canceled',
        }).where(eq(usersTable.stripeCustomerId, customerId));
        logger.info({ customerId }, 'Subscription cancelled — access blocked');
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as Stripe.Customer).id;
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        await db.update(usersTable).set({
          isSubscribed: isActive,
          subscriptionStatus: subscription.status,
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        }).where(eq(usersTable.stripeCustomerId, customerId));
        logger.info({ customerId, status: subscription.status }, 'Subscription updated via webhook');
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (err: any) {
    logger.error({ err, eventType: event.type }, 'Webhook handler error');
    res.status(500).json({ error: 'Handler error' });
  }
});

// Restore subscription — looks up paid Stripe subscriptions by the user's
// email and activates the account if one is found. Useful when the Stripe
// webhook fired but couldn't match a DB record (e.g. user hadn't logged in yet).
router.post('/subscription/restore', requireAuth, async (req, res) => {
  const user = req.dbUser!;
  // Already active — nothing to do
  if (user.isSubscribed) {
    res.json({ restored: true, alreadyActive: true });
    return;
  }
  if (!user.email) {
    res.status(400).json({ error: 'No email on account — cannot look up subscription.' });
    return;
  }
  try {
    const stripe = getStripeClient();
    // Search Stripe for customers with this email
    const customers = await stripe.customers.list({ email: user.email, limit: 5 });
    if (customers.data.length === 0) {
      res.json({ restored: false });
      return;
    }
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1,
      });
      if (subs.data.length > 0) {
        const sub = subs.data[0];
        await db.update(usersTable).set({
          isSubscribed: true,
          subscribedAt: new Date(),
          stripeCustomerId: customer.id,
          stripeSubscriptionId: sub.id,
          subscriptionStatus: sub.status,
          subscriptionCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
        }).where(eq(usersTable.id, user.id));
        logger.info({ userId: user.id, customerId: customer.id }, 'Subscription restored manually');
        res.json({ restored: true });
        return;
      }
    }
    res.json({ restored: false });
  } catch (err: any) {
    logger.error({ err }, 'Failed to restore subscription');
    res.status(500).json({ error: err.message ?? 'Restore failed' });
  }
});

// Current subscription status for the signed-in user (server-side truth).
router.get('/subscription/status', requireAuth, async (req, res) => {
  const user = req.dbUser!;
  res.json({
    isSubscribed: user.isSubscribed,
    subscriptionStatus: user.subscriptionStatus ?? null,
    subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd ?? null,
  });
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
