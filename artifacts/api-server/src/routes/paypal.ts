import { Router, type IRouter } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const paypal = require('@paypal/checkout-server-sdk') as any;
import { logger } from '../lib/logger';
import { sendOwnerNotificationEmail } from '../lib/email';

const router: IRouter = Router();

function getPayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }
  const environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
  return new paypal.core.PayPalHttpClient(environment);
}

// Create a PayPal order for subscription (€1/month billed as a one-time payment to keep simple)
router.post('/paypal/create-order', async (req, res) => {
  try {
    const { returnUrl, cancelUrl } = req.body as {
      returnUrl: string;
      cancelUrl: string;
    };

    const client = getPayPalClient();
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: 'Spark Premium — 1 month access',
          amount: {
            currency_code: 'EUR',
            value: '1.00',
          },
        },
      ],
      application_context: {
        brand_name: 'Spark',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    } as any);

    const order = await client.execute(request);
    const approveLink = (order.result.links as any[]).find(
      (l: any) => l.rel === 'approve'
    );

    res.json({ url: approveLink?.href, orderId: order.result.id });
  } catch (err: any) {
    logger.error({ err }, 'Failed to create PayPal order');
    res.status(500).json({ error: err.message ?? 'PayPal order failed' });
  }
});

// Capture a PayPal order after user approves
router.post('/paypal/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body as { orderId: string };
    if (!orderId) {
      res.status(400).json({ error: 'orderId required' });
      return;
    }

    const client = getPayPalClient();
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    (request as any).requestBody({});
    const capture = await client.execute(request);

    const status = capture.result.status;
    if (status === 'COMPLETED') {
      res.json({ success: true, status });
    } else {
      res.status(400).json({ error: `Unexpected status: ${status}` });
    }
  } catch (err: any) {
    logger.error({ err }, 'Failed to capture PayPal order');
    res.status(500).json({ error: err.message ?? 'PayPal capture failed' });
  }
});

// Creator withdrawal — PayPal Payouts requires a verified PayPal Business
// account, which the platform doesn't have yet. Instead of calling the
// Payouts API, we record the request and log it so the platform owner can
// pay the creator's PayPal email manually. Platform keeps a 10% fee, same
// split as Stripe — only the 90% net amount is quoted to the creator.
router.post('/paypal/withdraw', async (req, res) => {
  try {
    const { amount, payoutEmail } = req.body as {
      amount: number;
      payoutEmail: string;
    };

    if (!amount || amount < 1) {
      res.status(400).json({ error: 'Minimum withdrawal is €1' });
      return;
    }
    if (!payoutEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payoutEmail)) {
      res.status(400).json({ error: 'A valid PayPal email is required' });
      return;
    }

    const PLATFORM_FEE_RATE = 0.10;
    const fee = parseFloat((amount * PLATFORM_FEE_RATE).toFixed(2));
    const netAmount = parseFloat((amount - fee).toFixed(2));
    const referenceId = `spark-withdraw-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

    logger.info(
      { grossAmount: amount, fee, netAmount, payoutEmail, referenceId },
      'PayPal creator withdrawal requested — pending manual payout by platform owner'
    );

    sendOwnerNotificationEmail(
      `New PayPal withdrawal request — €${netAmount.toFixed(2)}`,
      `<h2>New creator withdrawal request</h2>
       <p><strong>Pay this creator via PayPal:</strong> ${payoutEmail}</p>
       <ul>
         <li>Gross earnings: €${amount.toFixed(2)}</li>
         <li>Platform fee (10%): €${fee.toFixed(2)}</li>
         <li><strong>Amount to send: €${netAmount.toFixed(2)}</strong></li>
       </ul>
       <p>Reference: ${referenceId}</p>
       <p>Please send this amount to the creator's PayPal email above within 24 hours.</p>`
    ).catch((err) => logger.error({ err }, 'Owner notification email failed'));

    res.json({
      success: true,
      grossAmount: amount,
      fee,
      netAmount,
      message: `Withdrawal request received. €${netAmount.toFixed(2)} will be sent to your PayPal account (${payoutEmail}) within 24 hours.`,
      referenceId,
    });
  } catch (err: any) {
    logger.error({ err }, 'PayPal withdrawal request failed');
    res.status(500).json({ error: err.message ?? 'Withdrawal request failed' });
  }
});

export default router;
