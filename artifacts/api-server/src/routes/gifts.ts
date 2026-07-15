import { Router, type IRouter, type Request, type Response } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, messagesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.post("/gifts/send", requireAuth, async (req: Request, res: Response) => {
  const senderId = req.dbUser!.id;
  const { receiverId, giftLabel, giftEmoji, tokens, amountEur } = req.body as {
    receiverId: string;
    giftLabel: string;
    giftEmoji?: string;
    tokens: number;
    amountEur: number;
  };

  if (!receiverId || !giftLabel || typeof tokens !== "number" || typeof amountEur !== "number") {
    res.status(400).json({ error: "receiverId, giftLabel, tokens and amountEur are required" });
    return;
  }

  await Promise.all([
    db
      .update(usersTable)
      .set({ earnings: sql`COALESCE(earnings, 0) + ${amountEur}` })
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
