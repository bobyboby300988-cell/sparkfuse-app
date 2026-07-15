import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { ensureDbUser } from "../lib/jitUser";

declare global {
  namespace Express {
    interface Request {
      dbUser?: typeof usersTable.$inferSelect;
    }
  }
}

/**
 * Ensures the request is authenticated via Clerk, then JIT-provisions a
 * matching row in our local `users` table (keyed by the Clerk user id) so
 * the rest of the app can keep using plain DB foreign keys.
 *
 * Also fire-and-forgets a `lastSeenAt` update so we can show real online
 * presence in the browse/explore screens.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.dbUser = await ensureDbUser(userId);

  // Fire-and-forget: update lastSeenAt so online presence is accurate.
  // Don't await — we never want this to slow down or block the request.
  db.update(usersTable)
    .set({ lastSeenAt: new Date() })
    .where(eq(usersTable.id, userId))
    .catch(() => {});

  next();
}
