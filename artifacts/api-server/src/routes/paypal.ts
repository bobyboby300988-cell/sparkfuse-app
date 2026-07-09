import { Router, type IRouter } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const paypal = require('@paypal/checkout-server-sdk') as any;
import { logger } from '../lib/logger';

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

// Get an OAuth2 access token for PayPal's REST APIs (used for Payouts,
// which isn't covered by the Checkout Server SDK).
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }
  const res = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to authenticate with PayPal: ${body}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// Creator withdrawal — real PayPal Payout sent directly to the creator's
// own PayPal email. Platform keeps a 10% fee, same split as Stripe.
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

    const accessToken = await getPayPalAccessToken();
    const senderBatchId = `spark-withdraw-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

    const payoutRes = await fetch('https://api-m.paypal.com/v1/payments/payouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: senderBatchId,
          email_subject: 'You have a payout from Spark!',
          email_message: 'You have received a creator withdrawal from Spark.',
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: { value: netAmount.toFixed(2), currency: 'EUR' },
            receiver: payoutEmail,
            note: `Spark creator withdrawal — gross €${amount.toFixed(2)}, fee €${fee.toFixed(2)}`,
            sender_item_id: senderBatchId,
          },
        ],
      }),
    });

    const payoutData = (await payoutRes.json()) as any;
    if (!payoutRes.ok) {
      logger.error({ payoutData }, 'PayPal payout failed');
      throw new Error(payoutData?.message ?? 'PayPal payout failed');
    }

    logger.info(
      { grossAmount: amount, fee, netAmount, payoutEmail, batchId: payoutData.batch_header?.payout_batch_id },
      'Creator withdrawal sent via PayPal'
    );

    res.json({
      success: true,
      grossAmount: amount,
      fee,
      netAmount,
      message: `€${netAmount.toFixed(2)} sent to your PayPal account (${payoutEmail}).`,
      referenceId: payoutData.batch_header?.payout_batch_id ?? senderBatchId,
    });
  } catch (err: any) {
    logger.error({ err }, 'PayPal withdrawal failed');
    res.status(500).json({ error: err.message ?? 'Withdrawal failed' });
  }
});

export default router;
