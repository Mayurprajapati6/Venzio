import { sql, and, eq, between } from "drizzle-orm";
import {
  holidays,
  attendance,
} from "../../db/schema";

export class BookingCancelRepository {
  static async getBookingForCancel(tx: any, bookingId: string, userId: string) {
    const [row] = await tx.execute(sql`
      SELECT * FROM bookings
      WHERE id = ${bookingId}
        AND user_id = ${userId}
      FOR UPDATE
    `);

    return row;
  }

  static async hasAttendance(tx: any, bookingId: string) {
    const rows = await tx
      .select()
      .from(attendance)
      .where(eq(attendance.bookingId, bookingId));

    return rows.length > 0;
  }

  static async isHoliday(tx: any, facilityId: string, date: Date) {
    const rows = await tx
      .select()
      .from(holidays)
      .where(
        and(
          eq(holidays.facilityId, facilityId),
          between(holidays.startDate, holidays.endDate, date)
        )
      );
    return rows.length > 0;
  }

  static async restoreSlot(
    tx: any,
    facilityId: string,
    date: Date,
    slotType: string
  ) {
    await tx.execute(sql`
      UPDATE facility_slots
      SET booked = booked - 1
      WHERE facility_id = ${facilityId}
        AND date = ${date}
        AND slot_type = ${slotType}
    `);
  }

  static async cancelBooking(tx: any, bookingId: string) {
    await tx.execute(sql`
      UPDATE bookings
      SET status = 'CANCELLED'
      WHERE id = ${bookingId}
    `);
  }
}
