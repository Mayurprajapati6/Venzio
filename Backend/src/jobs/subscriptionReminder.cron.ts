import { db } from "../db";
import { ownerSubscriptions } from "../db/schema";
import { lt, eq } from "drizzle-orm";

export async function subscriptionReminderJob() {
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

    // TODO:
    // send email: "Your subscription expired"
  }
}
