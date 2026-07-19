import { Router, type IRouter, type Request, type Response } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, messagesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// Cadourile primite se creditează ca STCoin în coinBalance — NU ca euro.
// Conversia în euro e manuală, la retragere, la cererea utilizatorului.

router.post("/gifts/send", requireAuth, async (req: Request, res: Response) => {
  const senderId = req.dbUser!.id;
  const { receiverId, giftLabel, giftEmoji, tokens } = req.body as {
    receiverId: string;
    giftLabel: string;
    giftEmoji?: string;
    tokens: number;
  };

  if (!receiverId || !giftLabel || typeof tokens !== "number" || tokens <= 0) {
    res.status(400).json({ error: "receiverId, giftLabel and tokens are required" });
    return;
  }

  await Promise.all([
    // Destinatarul primește STCoin în coinBalance (pot fi refolosiți sau retrași manual)
    db
      .update(usersTable)
      .set({ coinBalance: sql`COALESCE(coin_balance, 0) + ${tokens}` })
      .where(eq(usersTable.id, receiverId)),

    db.insert(messagesTable).values({
      senderId,
      receiverId,
      text: `${giftEmoji ?? "🎁"} ${giftLabel} · ${tokens} ST`,
      mediaType: "gift",
    }),
  ]);

  res.json({ ok: true });
});

// GET /gifts/earnings — sold euro acumulat din conversii manuale
router.get("/gifts/earnings", requireAuth, async (req: Request, res: Response) => {
  const user = await db
    .select({ earnings: usersTable.earnings })
    .from(usersTable)
    .where(eq(usersTable.id, req.dbUser!.id))
    .limit(1);

  const earnings = user[0]?.earnings ?? 0;
  res.json({ earnings: parseFloat(String(earnings)) });
});

export default router;
