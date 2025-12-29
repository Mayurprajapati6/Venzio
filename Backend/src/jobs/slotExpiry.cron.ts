import cron from "node-cron";
import { db } from "../db";
import { slotTemplates, facilities } from "../db/schema";
import { lte, eq, and } from "drizzle-orm";

cron.schedule("0 9 * * *", async () => {
  const warnDate = new Date();
  warnDate.setDate(warnDate.getDate() + 3);
  warnDate.setHours(0, 0, 0, 0);

  const expiringTemplates = await db
    .select({
      templateId: slotTemplates.id,
      facilityId: slotTemplates.facilityId,
      validTill: slotTemplates.validTill,
      ownerId: facilities.ownerId,
    })
    .from(slotTemplates)
    .innerJoin(
      facilities,
      eq(slotTemplates.facilityId, facilities.id)
    )
    .where(
      and(
        lte(slotTemplates.validTill, warnDate),
        eq(facilities.isPublished, true)
      )
    );

  for (const tpl of expiringTemplates) {
    /**
     * Send email:
     * "Your MORNING slot will expire on {{date}}.
     * You can update price/capacity or ignore to auto-continue."
     */
    
  }
});
