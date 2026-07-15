import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable, usersTable } from "@workspace/db";
import { GetMyProfileResponse, UpsertMyProfileBody, UpsertMyProfileResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;
  const [row] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));

  res.json(
    GetMyProfileResponse.parse({
      profile: row
        ? {
            userId: row.userId,
            name: row.name,
            age: row.age,
            bio: row.bio,
            seeking: row.seeking,
            photoUrl: row.photoUrl,
            city: row.city ?? null,
            country: row.country ?? null,
            latitude: row.latitude,
            longitude: row.longitude,
            distanceKm: null,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          }
        : null,
    }),
  );
});

router.put("/profile", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;

  const parsed = UpsertMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  const { name, age, bio, seeking, photoUrl, city, country, latitude, longitude } = parsed.data;

  const [row] = await db
    .insert(profilesTable)
    .values({ userId, name, age, bio, seeking, photoUrl, city: city ?? null, country: country ?? null, latitude, longitude })
    .onConflictDoUpdate({
      target: profilesTable.userId,
      set: { name, age, bio, seeking, photoUrl, city: city ?? null, country: country ?? null, latitude, longitude, updatedAt: new Date() },
    })
    .returning();

  res.json(
    UpsertMyProfileResponse.parse({
      profile: {
        userId: row.userId,
        name: row.name,
        age: row.age,
        bio: row.bio,
        seeking: row.seeking,
        photoUrl: row.photoUrl,
        city: row.city ?? null,
        country: row.country ?? null,
        latitude: row.latitude,
        longitude: row.longitude,
        distanceKm: null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    }),
  );
});

// GET /api/users/:userId/profile — profil public al altui utilizator
router.get("/users/:userId/profile", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
  const [user] = await db.select({ lastSeenAt: usersTable.lastSeenAt }).from(usersTable).where(eq(usersTable.id, userId));

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({
    profile: {
      userId: profile.userId,
      name: profile.name,
      age: profile.age,
      bio: profile.bio,
      seeking: profile.seeking,
      photoUrl: profile.photoUrl ?? null,
      city: profile.city ?? null,
      country: profile.country ?? null,
      lastSeenAt: user?.lastSeenAt?.toISOString() ?? null,
    },
  });
});

export default router;
