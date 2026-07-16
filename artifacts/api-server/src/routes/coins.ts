import { Router, type IRouter } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db, usersTable } from '@workspace/db';
import { requireAuth } from '../middlewares/requireAuth';
import { logger } from '../lib/logger';

const router: IRouter = Router();

// GET /coins — current balance for the signed-in user
router.get('/coins', requireAuth, async (req, res) => {
  const user = req.dbUser!;
  // Always fetch fresh balance directly from DB (avoid stale cache)
  const [fresh] = await db
    .select({ coinBalance: usersTable.coinBalance })
    .from(usersTable)
    .where(eq(usersTable.id, user.id));
  res.setHeader('Cache-Control', 'no-store');
  res.json({ coinBalance: fresh?.coinBalance ?? 0 });
});

// POST /coins/add — credit tokens (called after Stripe checkout verified client-side)
router.post('/coins/add', requireAuth, async (req, res) => {
  const user = req.dbUser!;
  const { amount } = req.body as { amount: number };
  if (typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'amount must be a positive number' });
    return;
  }
  try {
    const [updated] = await db
      .update(usersTable)
      .set({ coinBalance: sql`${usersTable.coinBalance} + ${amount}` })
      .where(eq(usersTable.id, user.id))
      .returning({ coinBalance: usersTable.coinBalance });
    logger.info({ userId: user.id, amount, newBalance: updated?.coinBalance }, 'Coins added');
    res.json({ coinBalance: updated?.coinBalance ?? 0 });
  } catch (err: any) {
    logger.error({ err }, 'Failed to add coins');
    res.status(500).json({ error: 'Failed to add coins' });
  }
});

// POST /coins/spend — debit tokens (called when sending a gift, unlocking photo, etc.)
router.post('/coins/spend', requireAuth, async (req, res) => {
  const user = req.dbUser!;
  const { amount } = req.body as { amount: number };
  if (typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'amount must be a positive number' });
    return;
  }
  const currentBalance = user.coinBalance ?? 0;
  if (currentBalance < amount) {
    res.status(400).json({ error: 'Insufficient balance' });
    return;
  }
  try {
    const [updated] = await db
      .update(usersTable)
      .set({ coinBalance: sql`GREATEST(0, ${usersTable.coinBalance} - ${amount})` })
      .where(eq(usersTable.id, user.id))
      .returning({ coinBalance: usersTable.coinBalance });
    logger.info({ userId: user.id, amount, newBalance: updated?.coinBalance }, 'Coins spent');
    res.json({ coinBalance: updated?.coinBalance ?? 0 });
  } catch (err: any) {
    logger.error({ err }, 'Failed to spend coins');
    res.status(500).json({ error: 'Failed to spend coins' });
  }
});

// POST /coins/admin-set — owner-only: set exact balance for a user (temporary)
router.post('/coins/admin-set', async (req, res) => {
  const { userId, amount, secret } = req.body as { userId: string; amount: number; secret: string };
  if (secret !== 'spark-owner-boby-2025') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ coinBalance: amount })
    .where(eq(usersTable.id, userId))
    .returning({ coinBalance: usersTable.coinBalance });
  logger.info({ userId, amount }, 'Admin set coins');
  res.json({ coinBalance: updated?.coinBalance ?? 0 });
});

export default router;
