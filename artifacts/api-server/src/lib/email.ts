import { logger } from './logger';

const OWNER_NOTIFICATION_EMAIL = 'dumitru8830@gmail.com';
const FROM_ADDRESS = 'Spark <onboarding@resend.dev>';

export async function sendOwnerNotificationEmail(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn('RESEND_API_KEY not configured; skipping owner notification email');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [OWNER_NOTIFICATION_EMAIL],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error({ status: res.status, body }, 'Failed to send owner notification email');
    return;
  }

  logger.info({ subject }, 'Owner notification email sent');
}
