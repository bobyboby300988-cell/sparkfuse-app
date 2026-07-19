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

// POST /coins/convert — conversie manuală STCoin → euro (adaugă la earnings, scade din coinBalance)
// 1 ST = €0.01. Comisionul platformei de 20% se aplică la retragere, nu aici.
router.post('/coins/convert', requireAuth, async (req, res) => {
  const user = req.dbUser!;
  const { amount } = req.body as { amount: number };
  if (typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'amount must be a positive number' });
    return;
  }
  const currentBalance = user.coinBalance ?? 0;
  if (currentBalance < amount) {
    res.status(400).json({ error: 'Insufficient coin balance' });
    return;
  }
  const eurAmount = parseFloat((amount * 0.01).toFixed(4));
  try {
    const [updated] = await db
      .update(usersTable)
      .set({
        coinBalance: sql`GREATEST(0, ${usersTable.coinBalance} - ${amount})`,
        earnings: sql`COALESCE(earnings, 0) + ${eurAmount}`,
      })
      .where(eq(usersTable.id, user.id))
      .returning({ coinBalance: usersTable.coinBalance, earnings: usersTable.earnings });
    logger.info({ userId: user.id, stCoins: amount, eurAmount, newCoinBalance: updated?.coinBalance }, 'STCoin converted to earnings');
    res.json({ coinBalance: updated?.coinBalance ?? 0, earnings: updated?.earnings ?? 0, eurAmount });
  } catch (err: any) {
    logger.error({ err }, 'Failed to convert coins');
    res.status(500).json({ error: 'Failed to convert coins' });
  }
});

export default router;
