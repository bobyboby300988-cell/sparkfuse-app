import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, inArray, notInArray, or } from "drizzle-orm";
import { db, matchesTable, profilesTable, swipesTable } from "@workspace/db";
import { GetFeedResponse, GetMatchesResponse, CreateSwipeBody, CreateSwipeResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function toApiProfile(row: typeof profilesTable.$inferSelect) {
  return {
    userId: row.userId,
    name: row.name,
    age: row.age,
    bio: row.bio,
    seeking: row.seeking,
    photoUrl: row.photoUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/feed", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const swiped = await db
    .select({ targetId: swipesTable.targetId })
    .from(swipesTable)
    .where(eq(swipesTable.swiperId, req.user.id));
  const swipedIds = swiped.map((s) => s.targetId);

  const excludeIds = [req.user.id, ...swipedIds];

  const rows = await db
    .select()
    .from(profilesTable)
    .where(notInArray(profilesTable.userId, excludeIds));

  res.json(GetFeedResponse.parse({ profiles: rows.map(toApiProfile) }));
});

router.post("/swipe", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateSwipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  const { targetUserId, direction } = parsed.data;

  await db
    .insert(swipesTable)
    .values({ swiperId: req.user.id, targetId: targetUserId, direction })
    .onConflictDoUpdate({
      target: [swipesTable.swiperId, swipesTable.targetId],
      set: { direction, createdAt: new Date() },
    });

  let matched = false;
  let matchProfile = null;

  if (direction === "like" || direction === "superlike") {
    const [reciprocal] = await db
      .select()
      .from(swipesTable)
      .where(
        and(
          eq(swipesTable.swiperId, targetUserId),
          eq(swipesTable.targetId, req.user.id),
          inArray(swipesTable.direction, ["like", "superlike"]),
        ),
      );

    if (reciprocal) {
      matched = true;
      const [userAId, userBId] = [req.user.id, targetUserId].sort();
      await db
        .insert(matchesTable)
        .values({ userAId, userBId })
        .onConflictDoNothing();

      const [profileRow] = await db
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.userId, targetUserId));
      matchProfile = profileRow ? toApiProfile(profileRow) : null;
    }
  }

  res.json(CreateSwipeResponse.parse({ matched, match: matchProfile }));
});

router.get("/matches", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select()
    .from(matchesTable)
    .where(or(eq(matchesTable.userAId, req.user.id), eq(matchesTable.userBId, req.user.id)));

  const otherIds = rows.map((r) => (r.userAId === req.user!.id ? r.userBId : r.userAId));
  if (otherIds.length === 0) {
    res.json(GetMatchesResponse.parse({ matches: [] }));
    return;
  }

  const profileRows = await db.select().from(profilesTable).where(inArray(profilesTable.userId, otherIds));

  res.json(GetMatchesResponse.parse({ matches: profileRows.map(toApiProfile) }));
});

export default router;
