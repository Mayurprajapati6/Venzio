import { sql, and, eq } from "drizzle-orm";
import { bookings, slotTemplates } from "../../db/schema";

export class BookingRepository {

  static async hasActiveBooking(
    tx: any,
    userId: string,
    facilityId: string,
    slotType: string
  ) {
    const result = await tx.execute(sql`
      SELECT id FROM bookings
      WHERE user_id = ${userId}
        AND facility_id = ${facilityId}
        AND slot_type = ${slotType}
        AND status IN ('PENDING','ACCEPTED','ACTIVE')
      FOR UPDATE
    `);
    return result.length > 0;
  }

  static async lockFacilitySlot(
    tx: any,
    facilityId: string,
    date: Date,
    slotType: string
  ) {
    const rows = await tx.execute(sql`
      SELECT * FROM facility_slots
      WHERE facility_id = ${facilityId}
        AND date = ${date}
        AND slot_type = ${slotType}
      FOR UPDATE
    `);
    return rows[0];
  }

  static async incrementBooked(tx: any, slotId: string) {
    await tx.execute(sql`
      UPDATE facility_slots
      SET booked = booked + 1
      WHERE id = ${slotId}
    `);
  }

  static async isHoliday(tx: any, facilityId: string, date: Date) {
    const rows = await tx.execute(sql`
        SELECT 1 FROM holidays
            WHERE facility_id = ${facilityId}
            AND ${date} BETWEEN start_date AND end_date
        LIMIT 1
    `);
    return rows.length > 0;
  }

  static async getSlotTemplate(tx: any, facilityId: string, slotType: string) {
    const [t] = await tx
      .select()
      .from(slotTemplates)
      .where(
        and(
          eq(slotTemplates.facilityId, facilityId),
          eq(slotTemplates.slotType, slotType as any)
        )
      );
    return t;
  }

  static async insertBooking(tx: any, data: any) {
    await tx.insert(bookings).values(data);
  }

  static async verifyFacilityBookable(tx: any, facilityId: string) {
  const rows = await tx.execute(sql`
    SELECT 1 FROM facilities
    WHERE id = ${facilityId}
      AND approval_status = 'APPROVED'
      AND is_published = true
    LIMIT 1
  `);
  return rows.length > 0;
}
}


