import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, eq, or } from "drizzle-orm";
import { db, messagesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/messages/:userId", requireAuth, async (req: Request, res: Response) => {
  const myId = req.dbUser!.id;
  const otherId = req.params.userId;

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        and(eq(messagesTable.senderId, myId), eq(messagesTable.receiverId, otherId)),
        and(eq(messagesTable.senderId, otherId), eq(messagesTable.receiverId, myId)),
      ),
    )
    .orderBy(asc(messagesTable.createdAt));

  res.json({ messages: msgs });
});

router.post("/messages", requireAuth, async (req: Request, res: Response) => {
  const { receiverId, text, mediaUrl, mediaType } = req.body as {
    receiverId: string;
    text?: string | null;
    mediaUrl?: string | null;
    mediaType?: string | null;
  };

  if (!receiverId || typeof receiverId !== "string") {
    res.status(400).json({ error: "receiverId is required" });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({
      senderId: req.dbUser!.id,
      receiverId,
      text: text ?? null,
      mediaUrl: mediaUrl ?? null,
      mediaType: mediaType ?? null,
    })
    .returning();

  res.json({ message: msg });
});

export default router;
