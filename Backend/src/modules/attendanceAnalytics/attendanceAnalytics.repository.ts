import { db } from "../../db";
import { attendance, bookings } from "../../db/schema";
import { eq, sql } from "drizzle-orm";

export class AttendanceAnalyticsRepository {
  
  static async getCalendar(userId: string, year: number, month: number) {
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    
    const attendanceRecords = (await db.execute(sql`
      SELECT 
        DATE(a.date) as date,
        f.name as facilityName,
        c.name as categoryName,
        b.slot_type as slotType
      FROM attendance a
      INNER JOIN bookings b ON a.booking_id = b.id
      INNER JOIN facilities f ON a.facility_id = f.id
      INNER JOIN categories c ON f.category_id = c.id
      WHERE b.user_id = ${userId}
        AND DATE(a.date) >= DATE(${startDate})
        AND DATE(a.date) <= DATE(${endDate})
      ORDER BY a.date
    `)) as any[] as Array<{
      date: Date;
      facilityName: string;
      categoryName: string;
      slotType: string;
    }>;

    
    const attendanceMap = new Map<string, typeof attendanceRecords[0]>();
    attendanceRecords.forEach((record) => {
      const date = record.date instanceof Date ? record.date : new Date(record.date);
      const dateStr = date.toISOString().split("T")[0];
      attendanceMap.set(dateStr, record);
    });

    
    const days: Array<{
      date: string;
      attended: boolean;
      facilityName?: string;
      category?: string;
      slotType?: "MORNING" | "AFTERNOON" | "EVENING";
    }> = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const attendance = attendanceMap.get(dateStr);

      days.push({
        date: dateStr,
        attended: !!attendance,
        facilityName: attendance?.facilityName,
        category: attendance?.categoryName,
        slotType: attendance?.slotType as "MORNING" | "AFTERNOON" | "EVENING" | undefined,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      year,
      month,
      days,
    };
  }

  
  static async getAttendanceDates(userId: string) {
    const records = await db
      .select({
        date: attendance.date,
      })
      .from(attendance)
      .innerJoin(bookings, eq(attendance.bookingId, bookings.id))
      .where(eq(bookings.userId, userId))
      .orderBy(attendance.date);

    return records.map((r) => r.date);
  }

  static async getMonthlyAttendance(userId: string, year: string) {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const result = (await db.execute(sql`
      SELECT 
        MONTH(a.date) as monthNum,
        COUNT(a.id) as attendanceCount
      FROM attendance a
      INNER JOIN bookings b ON a.booking_id = b.id
      WHERE b.user_id = ${userId}
        AND YEAR(a.date) = ${year}
      GROUP BY MONTH(a.date)
      ORDER BY monthNum
    `)) as any[] as Array<{
      monthNum: number;
      attendanceCount: number;
    }>;

    // Create map for quick lookup
    const monthMap = new Map<number, number>();
    result.forEach((r) => {
      monthMap.set(r.monthNum, Number(r.attendanceCount));
    });

    // Build array for all 12 months
    const monthlyData = months.map((monthName, index) => ({
      month: monthName,
      attendanceCount: monthMap.get(index + 1) || 0,
    }));

    return {
      year,
      monthlyData,
    };
  }

  static async getYearlyAttendance(userId: string) {
    const result = (await db.execute(sql`
      SELECT 
        YEAR(a.date) as year,
        COUNT(a.id) as attendanceCount
      FROM attendance a
      INNER JOIN bookings b ON a.booking_id = b.id
      WHERE b.user_id = ${userId}
      GROUP BY YEAR(a.date)
      ORDER BY year DESC
    `)) as any[] as Array<{
      year: number;
      attendanceCount: number;
    }>;

    return result.map((r) => ({
      year: String(r.year),
      attendanceCount: Number(r.attendanceCount),
    }));
  }

  static async getAttendanceDetail(userId: string, date: string) {
    const result = (await db.execute(sql`
      SELECT 
        DATE(a.date) as date,
        a.created_at as markedAt,
        f.name as facilityName,
        c.name as categoryName,
        f.city as facilityCity,
        u.name as ownerName,
        u.email as ownerEmail,
        b.pass_days as passDays,
        b.slot_type as slotType,
        b.start_date as startDate,
        b.end_date as endDate
      FROM attendance a
      INNER JOIN bookings b ON a.booking_id = b.id
      INNER JOIN facilities f ON a.facility_id = f.id
      INNER JOIN categories c ON f.category_id = c.id
      INNER JOIN users u ON f.owner_id = u.id
      WHERE b.user_id = ${userId}
        AND DATE(a.date) = DATE(${date})
      LIMIT 1
    `)) as any[] as Array<{
      date: Date;
      markedAt: Date;
      facilityName: string;
      categoryName: string;
      facilityCity: string;
      ownerName: string;
      ownerEmail: string;
      passDays: number;
      slotType: string;
      startDate: Date;
      endDate: Date;
    }>;

    if (result.length === 0) {
      return null;
    }

    const record = result[0];

    // Format time
    const markedAt = new Date(record.markedAt);
    const hours = markedAt.getHours();
    const minutes = markedAt.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    const markedByOwnerAt = `${displayHours}:${displayMinutes} ${ampm}`;

    return {
      date: record.date.toISOString().split("T")[0],
      facility: {
        name: record.facilityName,
        category: record.categoryName,
        city: record.facilityCity,
      },
      owner: {
        name: record.ownerName,
        email: record.ownerEmail,
      },
      booking: {
        passDays: Number(record.passDays),
        slotType: record.slotType as "MORNING" | "AFTERNOON" | "EVENING",
        startDate: record.startDate,
        endDate: record.endDate,
      },
      markedByOwnerAt,
    };
  }
}

