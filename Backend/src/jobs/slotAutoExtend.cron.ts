import cron from "node-cron";
import { db } from "../db";
import { slotTemplates } from "../db/schema";
import { lt, eq } from "drizzle-orm";

const AUTO_EXTEND_DAYS = 15;

cron.schedule("5 0 * * *", async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredTemplates = await db
    .select()
    .from(slotTemplates)
    .where(lt(slotTemplates.validTill, today));

  for (const tpl of expiredTemplates) {
    const newValidTill = new Date(today);
    newValidTill.setDate(newValidTill.getDate() + AUTO_EXTEND_DAYS);

    await db
      .update(slotTemplates)
      .set({ validTill: newValidTill })
      .where(eq(slotTemplates.id, tpl.id));
  }
});
