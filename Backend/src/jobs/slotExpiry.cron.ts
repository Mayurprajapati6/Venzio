import cron from "node-cron";
import { db } from "../db";
import { slotTemplates } from "../db/schema";
import { lte } from "drizzle-orm";

cron.schedule("0 9 * * *", async () => {
  const warnDate = new Date();
  warnDate.setDate(warnDate.getDate() + 3);

  const expiring = await db
    .select()
    .from(slotTemplates)
    .where(lte(slotTemplates.validTill, warnDate));

  for (const tpl of expiring) {
    // send email here
  }
});
