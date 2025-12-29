import cron from "node-cron";
import { db } from "../db";
import { facilities } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { SlotGenerationService } from "../modules/slot/slotGeneration.service";

cron.schedule("0 */2 * * *", async () => {
  const activeFacilities = await db
    .select({ id: facilities.id })
    .from(facilities)
    .where(
      and(
        eq(facilities.isPublished, true),
        eq(facilities.approvalStatus, "APPROVED")
      )
    );

  for (const facility of activeFacilities) {
    await SlotGenerationService.regenerateForFacility(facility.id);
  }
});
