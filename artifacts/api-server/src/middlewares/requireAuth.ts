import { getAuth } from "@clerk/express";
import { type Request, type Response, type NextFunction } from "express";
import { type usersTable } from "@workspace/db";
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
  next();
}
