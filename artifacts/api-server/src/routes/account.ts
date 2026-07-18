import { Router, type IRouter, type Request, type Response } from "express";
import { or, eq } from "drizzle-orm";
import {
  db,
  usersTable,
  profilesTable,
  swipesTable,
  matchesTable,
  blocksTable,
  messagesTable,
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
  await db.delete(messagesTable).where(
    or(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, userId)),
  );
  await db.delete(profilesTable).where(eq(profilesTable.userId, userId));

  res.json({ ok: true });
});

/**
 * DELETE /api/account
 * Deletes all app data from DB (cascades profile, swipes, matches, blocks).
 * The Clerk account (email + password) is intentionally kept so the user
 * can sign back in and re-register with the same email.
 */
router.delete("/account", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;

  // Delete DB row — cascades profile, swipes, matches, blocks automatically
  await db.delete(usersTable).where(eq(usersTable.id, userId));

  res.json({ ok: true });
});

// GET /api/account/notifications — get notification preferences
router.get("/account/notifications", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;
  const [user] = await db.select({
    notifCalls: usersTable.notifCalls,
    notifMessages: usersTable.notifMessages,
    notifMatches: usersTable.notifMatches,
  }).from(usersTable).where(eq(usersTable.id, userId));
  res.json({ prefs: user ?? { notifCalls: true, notifMessages: true, notifMatches: true } });
});

router.put("/account/notifications", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;
  const body = req.body as Record<string, unknown>;
  const update: { notifCalls?: boolean; notifMessages?: boolean; notifMatches?: boolean } = {};
  if (typeof body.notifCalls === "boolean") update.notifCalls = body.notifCalls;
  if (typeof body.notifMessages === "boolean") update.notifMessages = body.notifMessages;
  if (typeof body.notifMatches === "boolean") update.notifMatches = body.notifMatches;
  if (Object.keys(update).length === 0) return res.status(400).json({ error: "Nothing to update" });
  await db.update(usersTable).set(update).where(eq(usersTable.id, userId));
  res.json({ ok: true });
});

export default router;
