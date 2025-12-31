// src/modules/subscription/subscription.repository.ts
import { db } from "../../db";
import { eq, and, gt, lt } from "drizzle-orm";
import { ownerSubscriptions } from "../../db/schema";
import type { SubscriptionCreateInput } from "./subscription.types";

export class SubscriptionRepository {
  static async getActiveByOwner(ownerId: string) {
    const now = new Date();

    const [sub] = await db
      .select()
      .from(ownerSubscriptions)
      .where(
        and(
          eq(ownerSubscriptions.ownerId, ownerId),
          eq(ownerSubscriptions.isActive, true),
          gt(ownerSubscriptions.endDate, now)
        )
      );

    return sub ?? null;
  }

  static async create(data: SubscriptionCreateInput & { id: string }) {
    await db.insert(ownerSubscriptions).values({
      ...data,
      isActive: true,
    });
  }

  static async deactivateExpired(ownerId: string) {
    const now = new Date();

    await db
      .update(ownerSubscriptions)
      .set({ isActive: false })
      .where(
        and(
          eq(ownerSubscriptions.ownerId, ownerId),
          lt(ownerSubscriptions.endDate, now)
        )
      );
  }

  static async getAll() {
    return db.select().from(ownerSubscriptions);
  }
}
