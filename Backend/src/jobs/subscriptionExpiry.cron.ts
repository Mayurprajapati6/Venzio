import cron from "node-cron";
import { db } from "../db";
import { ownerSubscriptions } from "../db/schema";
import { lt, eq } from "drizzle-orm";

/**
 * Runs daily at 03:00 AM
 * Deactivates expired subscriptions
 */
cron.schedule("0 3 * * *", async () => {
  const now = new Date();

  const expired = await db
    .select()
    .from(ownerSubscriptions)
    .where(lt(ownerSubscriptions.endDate, now));

  for (const sub of expired) {
    await db
      .update(ownerSubscriptions)
      .set({ isActive: false })
      .where(eq(ownerSubscriptions.id, sub.id));

    // TODO: send email notification
  }

  console.log("[CRON] Subscription expiry check completed");
});
