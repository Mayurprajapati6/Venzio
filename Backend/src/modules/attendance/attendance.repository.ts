import { attendance, bookings, holidays } from "../../db/schema";
import { and, eq, between } from "drizzle-orm";
import { randomUUID } from "crypto";

export class AttendanceRepository {
  static async alreadyMarked(
    tx: any,
    bookingId: string,
    date: Date
  ) {
    const rows = await tx
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.bookingId, bookingId),
          eq(attendance.date, date)
        )
      );
    return rows.length > 0;
  }

  static async isHoliday(
    tx: any,
    facilityId: string,
    date: Date
  ) {
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

  static async getBookingForScan(
    tx: any,
    bookingId: string
  ) {
    const [row] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .for("update");

    return row;
  }

  static async insertAttendance(
    tx: any,
    bookingId: string,
    facilityId: string,
    date: Date
  ) {
    await tx.insert(attendance).values({
      id: randomUUID(),
      bookingId,
      facilityId,
      date,
    });
  }

  static async decrementActiveDay(
    tx: any,
    bookingId: string
  ) {
    await tx.execute(`
      UPDATE bookings
      SET active_days_remaining = active_days_remaining - 1
      WHERE id = '${bookingId}'
    `);
  }

  static async completeBooking(
    tx: any,
    bookingId: string
  ) {
    await tx.execute(`
      UPDATE bookings
      SET status = 'COMPLETED'
      WHERE id = '${bookingId}'
    `);
  }
}
