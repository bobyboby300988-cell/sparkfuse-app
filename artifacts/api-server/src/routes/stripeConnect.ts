import { Router, type IRouter } from 'express';
import { getStripeClient } from '../stripeClient';
import { logger } from '../lib/logger';

const router: IRouter = Router();

// Stripe account links require real https:// URLs (custom app schemes like
// "mobile://" are rejected). We host tiny redirect pages here that bounce
// the browser back into the app via its deep link scheme.
function getPublicBaseUrl(): string {
  const domains = process.env.REPLIT_DOMAINS;
  const first = domains?.split(',')[0]?.trim();
  if (!first) {
    throw new Error('REPLIT_DOMAINS is not set; cannot build a public HTTPS redirect URL');
  }
  return `https://${first}`;
}

function redirectPage(deepLink: string): string {
  return `<!doctype html><html><head><meta http-equiv="refresh" content="0;url=${deepLink}" /></head><body><script>window.location.replace(${JSON.stringify(deepLink)});</script>Redirecting back to the app…</body></html>`;
}

router.get('/stripe/connect/redirect/:kind', (req, res) => {
  const { kind } = req.params;
  const deepLink = kind === 'refresh' ? 'mobile://connect-refresh' : 'mobile://connect-return';
  res.set('Content-Type', 'text/html').send(redirectPage(deepLink));
});

// Create (or reuse) a Stripe Connect Express account for a creator and
// return a hosted onboarding link. The creator verifies their identity and
// bank account directly with Stripe.
router.post('/stripe/connect/onboard', async (req, res) => {
  try {
    const { accountId, email } = req.body as {
      accountId?: string;
      email?: string;
      refreshUrl?: string;
      returnUrl?: string;
    };

    const stripe = getStripeClient();
    const baseUrl = getPublicBaseUrl();

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
      refresh_url: `${baseUrl}/api/stripe/connect/redirect/refresh`,
      return_url: `${baseUrl}/api/stripe/connect/redirect/return`,
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
