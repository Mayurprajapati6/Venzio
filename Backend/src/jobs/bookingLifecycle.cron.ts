import cron from "node-cron";
import { db } from "../db";
import { bookings } from "../db/schema";
import { and, eq, lt, lte } from "drizzle-orm";

cron.schedule("*/30 * * * *", async () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Activate bookings
  await db
    .update(bookings)
    .set({ status: "ACTIVE" })
    .where(
      and(
        eq(bookings.status, "ACCEPTED"),
        lte(bookings.startDate, now)
      )
    );

  // Complete bookings
  await db
    .update(bookings)
    .set({ status: "COMPLETED" })
    .where(
      and(
        eq(bookings.status, "ACTIVE"),
        lt(bookings.endDate, now)
      )
    );
});
