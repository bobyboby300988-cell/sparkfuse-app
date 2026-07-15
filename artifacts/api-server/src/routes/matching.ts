import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, inArray, notInArray, or, sql } from "drizzle-orm";
import { db, matchesTable, profilesTable, swipesTable, blocksTable } from "@workspace/db";
import { GetFeedResponse, GetMatchesResponse, CreateSwipeBody, CreateSwipeResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toApiProfile(
  row: typeof profilesTable.$inferSelect,
  from?: { latitude: number | null; longitude: number | null } | null,
) {
  let distanceKm: number | null = null;
  if (from?.latitude != null && from?.longitude != null && row.latitude != null && row.longitude != null) {
    distanceKm = Math.round(haversineKm(from.latitude, from.longitude, row.latitude, row.longitude) * 10) / 10;
  }

  return {
    userId: row.userId,
    name: row.name,
    age: row.age,
    bio: row.bio,
    seeking: row.seeking,
    photoUrl: row.photoUrl,
    latitude: row.latitude,
    longitude: row.longitude,
    distanceKm,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.delete("/swipes", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;
  const result = await db.delete(swipesTable).where(eq(swipesTable.swiperId, userId));
  res.json({ deleted: result.rowCount ?? 0 });
});

router.get("/feed", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;

  const [myProfile] = await db
    .select({ latitude: profilesTable.latitude, longitude: profilesTable.longitude })
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId));

  const swiped = await db
    .select({ targetId: swipesTable.targetId })
    .from(swipesTable)
    .where(eq(swipesTable.swiperId, userId));
  const swipedIds = swiped.map((s) => s.targetId);

  const blocks = await db
    .select({ blockerId: blocksTable.blockerId, blockedId: blocksTable.blockedId })
    .from(blocksTable)
    .where(or(eq(blocksTable.blockerId, userId), eq(blocksTable.blockedId, userId)));
  const blockedIds = blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));

  const excludeIds = [userId, ...swipedIds, ...blockedIds];

  const FEED_PAGE_SIZE = 50;

  const rows = await db
    .select()
    .from(profilesTable)
    .where(notInArray(profilesTable.userId, excludeIds))
    .orderBy(sql`random()`)
    .limit(FEED_PAGE_SIZE);

  const profiles = rows
    .map((row) => toApiProfile(row, myProfile))
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });

  res.json(GetFeedResponse.parse({ profiles }));
});

router.post("/swipe", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;

  const parsed = CreateSwipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  const { targetUserId, direction } = parsed.data;

  await db
    .insert(swipesTable)
    .values({ swiperId: userId, targetId: targetUserId, direction })
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
          eq(swipesTable.targetId, userId),
          inArray(swipesTable.direction, ["like", "superlike"]),
        ),
      );

    if (reciprocal) {
      matched = true;
      const [userAId, userBId] = [userId, targetUserId].sort();
      await db
        .insert(matchesTable)
        .values({ userAId, userBId })
        .onConflictDoNothing();

      const [myProfile] = await db
        .select({ latitude: profilesTable.latitude, longitude: profilesTable.longitude })
        .from(profilesTable)
        .where(eq(profilesTable.userId, userId));

      const [profileRow] = await db
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.userId, targetUserId));
      matchProfile = profileRow ? toApiProfile(profileRow, myProfile) : null;
    }
  }

  res.json(CreateSwipeResponse.parse({ matched, match: matchProfile }));
});

router.get("/matches", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;

  const rows = await db
    .select()
    .from(matchesTable)
    .where(or(eq(matchesTable.userAId, userId), eq(matchesTable.userBId, userId)));

  let otherIds = rows.map((r) => (r.userAId === userId ? r.userBId : r.userAId));
  if (otherIds.length === 0) {
    res.json(GetMatchesResponse.parse({ matches: [] }));
    return;
  }

  const blocks = await db
    .select({ blockerId: blocksTable.blockerId, blockedId: blocksTable.blockedId })
    .from(blocksTable)
    .where(or(eq(blocksTable.blockerId, userId), eq(blocksTable.blockedId, userId)));
  const blockedIds = new Set(blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)));
  otherIds = otherIds.filter((id) => !blockedIds.has(id));

  if (otherIds.length === 0) {
    res.json(GetMatchesResponse.parse({ matches: [] }));
    return;
  }

  const [myProfile] = await db
    .select({ latitude: profilesTable.latitude, longitude: profilesTable.longitude })
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId));

  const profileRows = await db.select().from(profilesTable).where(inArray(profilesTable.userId, otherIds));

  res.json(GetMatchesResponse.parse({ matches: profileRows.map((row) => toApiProfile(row, myProfile)) }));
});

router.get("/browse", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;

  const [myProfile] = await db
    .select({ latitude: profilesTable.latitude, longitude: profilesTable.longitude })
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId));

  const blocks = await db
    .select({ blockerId: blocksTable.blockerId, blockedId: blocksTable.blockedId })
    .from(blocksTable)
    .where(or(eq(blocksTable.blockerId, userId), eq(blocksTable.blockedId, userId)));
  const blockedIds = blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));

  const excludeIds = [userId, ...blockedIds];

  const rows = await db
    .select()
    .from(profilesTable)
    .where(notInArray(profilesTable.userId, excludeIds))
    .orderBy(sql`random()`)
    .limit(100);

  res.json({ profiles: rows.map((row) => toApiProfile(row, myProfile)) });
});

export default router;
