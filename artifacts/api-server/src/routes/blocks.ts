import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, blocksTable } from "@workspace/db";
import { CreateBlockBody, GetBlocksResponse, CreateBlockResponse, DeleteBlockResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/blocks", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;
  const rows = await db
    .select({ blockedId: blocksTable.blockedId })
    .from(blocksTable)
    .where(eq(blocksTable.blockerId, userId));

  res.json(GetBlocksResponse.parse({ blockedUserIds: rows.map((r) => r.blockedId) }));
});

router.post("/blocks", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;

  const parsed = CreateBlockBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  const { targetUserId } = parsed.data;

  if (targetUserId === userId) {
    res.status(400).json({ error: "Cannot block yourself" });
    return;
  }

  await db
    .insert(blocksTable)
    .values({ blockerId: userId, blockedId: targetUserId })
    .onConflictDoNothing();

  const rows = await db
    .select({ blockedId: blocksTable.blockedId })
    .from(blocksTable)
    .where(eq(blocksTable.blockerId, userId));

  res.json(CreateBlockResponse.parse({ blockedUserIds: rows.map((r) => r.blockedId) }));
});

router.delete("/blocks/:userId", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;
  const targetUserId = String(req.params.userId);

  await db
    .delete(blocksTable)
    .where(and(eq(blocksTable.blockerId, userId), eq(blocksTable.blockedId, targetUserId)));

  const rows = await db
    .select({ blockedId: blocksTable.blockedId })
    .from(blocksTable)
    .where(eq(blocksTable.blockerId, userId));

  res.json(DeleteBlockResponse.parse({ blockedUserIds: rows.map((r) => r.blockedId) }));
});

export default router;
