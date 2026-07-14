import { Router, type IRouter, type Request, type Response } from "express";
import { or, eq } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import {
  db,
  usersTable,
  profilesTable,
  swipesTable,
  matchesTable,
  blocksTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

/**
 * POST /api/account/reset
 * Wipes profile, swipes, matches, and blocks — but keeps the users row
 * (email, password, subscription). The user returns to onboarding.
 */
router.post("/account/reset", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;

  await db.delete(blocksTable).where(
    or(eq(blocksTable.blockerId, userId), eq(blocksTable.blockedId, userId)),
  );
  await db.delete(matchesTable).where(
    or(eq(matchesTable.userAId, userId), eq(matchesTable.userBId, userId)),
  );
  await db.delete(swipesTable).where(
    or(eq(swipesTable.swiperId, userId), eq(swipesTable.targetId, userId)),
  );
  await db.delete(profilesTable).where(eq(profilesTable.userId, userId));

  res.json({ ok: true });
});

/**
 * DELETE /api/account
 * Deletes everything: DB row (cascades all child data) + Clerk account.
 * The user must re-register and re-subscribe to come back.
 */
router.delete("/account", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;

  // Delete DB row — cascades profile, swipes, matches, blocks automatically
  await db.delete(usersTable).where(eq(usersTable.id, userId));

  // Delete Clerk account (best-effort — DB is already gone)
  try {
    await clerkClient.users.deleteUser(userId);
  } catch (err) {
    req.log.warn({ err }, "Clerk user deletion failed — DB record already removed");
  }

  res.json({ ok: true });
});

export default router;
