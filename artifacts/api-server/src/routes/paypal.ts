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

export default router;
