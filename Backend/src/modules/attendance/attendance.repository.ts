import { db } from "../../db";
import { attendance, bookings, holidays, facilities, users, slotTemplates } from "../../db/schema";
import { and, eq, between, sql } from "drizzle-orm";
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
    const rows = (await tx.execute(sql`
      SELECT * FROM bookings WHERE id = ${bookingId} FOR UPDATE
    `)) as any[];
    return rows[0] || null;
  }

  /**
   * Get booking with facility and user details for QR scan preview
   */
  static async getBookingWithDetails(bookingId: string) {
    const result = (await db.execute(sql`
      SELECT 
        b.id as bookingId,
        b.facility_id as facilityId,
        b.slot_type as slotType,
        b.pass_days as passDays,
        b.start_date as startDate,
        b.end_date as endDate,
        b.active_days_remaining as activeDaysRemaining,
        b.status as bookingStatus,
        f.name as facilityName,
        f.owner_id as ownerId,
        u.name as userName,
        st.start_time as slotStartTime,
        st.end_time as slotEndTime
      FROM bookings b
      INNER JOIN facilities f ON b.facility_id = f.id
      INNER JOIN users u ON b.user_id = u.id
      LEFT JOIN slot_templates st ON f.id = st.facility_id AND b.slot_type = st.slot_type
      WHERE b.id = ${bookingId}
    `)) as any[] as Array<{
      bookingId: string;
      facilityId: string;
      slotType: string;
      passDays: number;
      startDate: Date;
      endDate: Date;
      activeDaysRemaining: number;
      bookingStatus: string;
      facilityName: string;
      ownerId: string;
      userName: string;
      slotStartTime: string | null;
      slotEndTime: string | null;
    }>;

    return result[0] || null;
  }

  /**
   * Check if attendance already marked today
   */
  static async checkAttendanceToday(bookingId: string, date: Date) {
    const rows = await db
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
    await tx.execute(sql`
      UPDATE bookings
      SET active_days_remaining = active_days_remaining - 1
      WHERE id = '${bookingId}'
    `);
  }

  static async completeBooking(
    tx: any,
    bookingId: string
  ) {
    await tx.execute(sql`
      UPDATE bookings
      SET status = 'COMPLETED'
      WHERE id = '${bookingId}'
    `);
  }
}
