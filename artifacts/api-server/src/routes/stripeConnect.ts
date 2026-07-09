import { Router, type IRouter } from 'express';
import { getStripeClient } from '../stripeClient';
import { logger } from '../lib/logger';

const router: IRouter = Router();

// Create (or reuse) a Stripe Connect Express account for a creator and
// return a hosted onboarding link. The creator verifies their identity and
// bank account directly with Stripe.
router.post('/stripe/connect/onboard', async (req, res) => {
  try {
    const { accountId, email, refreshUrl, returnUrl } = req.body as {
      accountId?: string;
      email?: string;
      refreshUrl: string;
      returnUrl: string;
    };

    if (!refreshUrl || !returnUrl) {
      res.status(400).json({ error: 'refreshUrl and returnUrl are required' });
      return;
    }

    const stripe = getStripeClient();

    let id = accountId;
    if (!id) {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: 'individual',
      });
      id = account.id;
    }

    const accountLink = await stripe.accountLinks.create({
      account: id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    res.json({ accountId: id, url: accountLink.url });
  } catch (err: any) {
    logger.error({ err }, 'Failed to create Connect onboarding link');
    res.status(500).json({ error: err.message ?? 'Onboarding failed' });
  }
});

// Check whether a creator has finished onboarding and can actually receive payouts.
router.get('/stripe/connect/status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const stripe = getStripeClient();
    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      accountId: account.id,
      detailsSubmitted: !!account.details_submitted,
      chargesEnabled: !!account.charges_enabled,
      payoutsEnabled: !!account.payouts_enabled,
    });
  } catch (err: any) {
    logger.error({ err }, 'Failed to fetch Connect account status');
    res.status(500).json({ error: err.message ?? 'Failed to fetch account status' });
  }
});

export default router;
