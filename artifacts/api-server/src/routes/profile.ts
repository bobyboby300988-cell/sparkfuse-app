import { Router, type IRouter, type Request, type Response } from "express";
import { eq, asc } from "drizzle-orm";
import { db, profilesTable, usersTable, userPhotosTable } from "@workspace/db";
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

// GET /api/users/:userId/photos — galeria publică + exclusivă a unui utilizator
router.get("/users/:userId/photos", requireAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;
  const photos = await db
    .select()
    .from(userPhotosTable)
    .where(eq(userPhotosTable.userId, userId))
    .orderBy(asc(userPhotosTable.sortOrder), asc(userPhotosTable.createdAt));

  res.json({
    photos: photos.map((p) => ({
      id: p.id,
      objectPath: p.objectPath,
      isExclusive: p.isExclusive,
      mediaType: p.mediaType,
      sortOrder: p.sortOrder,
    })),
  });
});

// POST /api/my/photos — adaugă o poză la galeria mea
router.post("/my/photos", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;
  const { objectPath, isExclusive, mediaType, sortOrder } = req.body ?? {};
  if (!objectPath || typeof objectPath !== "string") {
    res.status(400).json({ error: "objectPath is required" });
    return;
  }
  const safeMediaType: "image" | "video" = mediaType === "video" ? "video" : "image";
  const [photo] = await db
    .insert(userPhotosTable)
    .values({
      userId,
      objectPath,
      isExclusive: isExclusive === true,
      mediaType: safeMediaType,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    })
    .returning();
  res.json({ photo: { id: photo.id, objectPath: photo.objectPath, isExclusive: photo.isExclusive, mediaType: photo.mediaType } });
});

// DELETE /api/my/photos/:photoId — șterge o poză din galeria mea
router.delete("/my/photos/:photoId", requireAuth, async (req: Request, res: Response) => {
  const userId = req.dbUser!.id;
  const { photoId } = req.params;
  const [photo] = await db.select().from(userPhotosTable).where(eq(userPhotosTable.id, photoId));
  if (!photo || photo.userId !== userId) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }
  await db.delete(userPhotosTable).where(eq(userPhotosTable.id, photoId));
  res.json({ deleted: true });
});

export default router;
