import { db } from "../../db";
import {
  slotTemplates,
  facilitySlots,
} from "../../db/schema";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export class SlotRepository {
  /* =======================
     SLOT TEMPLATE
  ======================= */

  static async getTemplatesByFacility(facilityId: string) {
    return db
      .select()
      .from(slotTemplates)
      .where(eq(slotTemplates.facilityId, facilityId));
  }

  static async getTemplateByType(
    facilityId: string,
    slotType: "MORNING" | "AFTERNOON" | "EVENING"
  ) {
    const [tpl] = await db
      .select()
      .from(slotTemplates)
      .where(
        and(
          eq(slotTemplates.facilityId, facilityId),
          eq(slotTemplates.slotType, slotType)
        )
      );

    return tpl ?? null;
  }

  static async createTemplate(data: any) {
    await db.insert(slotTemplates).values(data);
  }

  static async updateTemplate(
    id: string,
    data: Partial<typeof slotTemplates.$inferInsert>
  ) {
    await db
      .update(slotTemplates)
      .set(data)
      .where(eq(slotTemplates.id, id));
  }

  /* =======================
     CAPACITY SAFETY
  ======================= */

  static async getMaxBooked(
    facilityId: string,
    slotType: "MORNING" | "AFTERNOON" | "EVENING"
  ): Promise<number> {
    const rows = await db
      .select({
        maxBooked: sql<number>`MAX(${facilitySlots.booked})`,
      })
      .from(facilitySlots)
      .where(
        and(
          eq(facilitySlots.facilityId, facilityId),
          eq(facilitySlots.slotType, slotType)
        )
      );

    return rows[0]?.maxBooked ?? 0;
  }

  /* =======================
     FACILITY SLOT (GENERATION)
  ======================= */

  static async slotExists(
    facilityId: string,
    date: Date,
    slotType: "MORNING" | "AFTERNOON" | "EVENING"
  ) {
    const rows = await db
      .select()
      .from(facilitySlots)
      .where(
        and(
          eq(facilitySlots.facilityId, facilityId),
          eq(facilitySlots.date, date),
          eq(facilitySlots.slotType, slotType)
        )
      );

    return rows.length > 0;
  }

  static async createFacilitySlot(
    facilityId: string,
    date: Date,
    slotType: "MORNING" | "AFTERNOON" | "EVENING",
    capacity: number
  ) {
    await db.insert(facilitySlots).values({
      id: randomUUID(),
      facilityId,
      date,
      slotType,
      capacity,
      booked: 0,
    });
  }
}
