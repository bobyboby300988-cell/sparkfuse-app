import { clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

/**
 * Returns the local `users` row for the given Clerk user id, creating it on
 * first sight (JIT provisioning) from Clerk's user profile.
 */
export async function ensureDbUser(userId: string): Promise<typeof usersTable.$inferSelect> {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(userId);
  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;

  const [created] = await db
    .insert(usersTable)
    .values({
      id: userId,
      email: primaryEmail ?? null,
      firstName: clerkUser.firstName ?? null,
      lastName: clerkUser.lastName ?? null,
      profileImageUrl: clerkUser.imageUrl ?? null,
    })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        email: primaryEmail ?? null,
        firstName: clerkUser.firstName ?? null,
        lastName: clerkUser.lastName ?? null,
        profileImageUrl: clerkUser.imageUrl ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (created) return created;

  const [row] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return row;
}
