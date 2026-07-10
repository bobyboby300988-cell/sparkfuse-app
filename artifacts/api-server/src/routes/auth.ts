import { getAuth } from "@clerk/express";
import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetCurrentAuthUserResponse, ActivateSubscriptionResponse } from "@workspace/api-zod";
import { ensureDbUser } from "../lib/jitUser";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/auth/user", async (req: Request, res: Response) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.json(GetCurrentAuthUserResponse.parse({ user: null }));
    return;
  }

  const user = await ensureDbUser(auth.userId);
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        isSubscribed: user.isSubscribed,
      },
    }),
  );
});

router.post("/subscription/activate", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;
  const [updated] = await db
    .update(usersTable)
    .set({ isSubscribed: true, subscribedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning();

  res.json(
    ActivateSubscriptionResponse.parse({
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        profileImageUrl: updated.profileImageUrl,
        isSubscribed: updated.isSubscribed,
      },
    }),
  );
});

export default router;
