import { db } from "../../db";
import { bookings, attendance, facilities, categories } from "../../db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

export class UserDashboardRepository {
  
  static async getUserPasses(userId: string) {
    // Get all bookings for user with facility and category info
    const allBookings = await db
      .select({
        id: bookings.id,
        facilityId: bookings.facilityId,
        slotType: bookings.slotType,
        startDate: bookings.startDate,
        endDate: bookings.endDate,
        activeDaysRemaining: bookings.activeDaysRemaining,
        qrCode: bookings.qrCode,
        status: bookings.status,
        facilityName: facilities.name,
        categoryName: categories.name,
      })
      .from(bookings)
      .innerJoin(facilities, eq(bookings.facilityId, facilities.id))
      .innerJoin(categories, eq(facilities.categoryId, categories.id))
      .where(eq(bookings.userId, userId));

    return allBookings;
  }

  static async getUserSpending(userId: string) {
    // Total spending
    const totalResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${bookings.totalAmount}), 0)`.as("total"),
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          inArray(bookings.status, ["ACTIVE", "COMPLETED"])
        )
      );

    const totalSpending = Number(totalResult[0]?.total || 0);

    // Monthly spending (YYYY-MM format)
    const monthlyResult = (await db.execute(sql`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COALESCE(SUM(total_amount), 0) as amount
      FROM bookings
      WHERE user_id = ${userId}
        AND status IN ('ACTIVE', 'COMPLETED')
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `)) as any[] as Array<{ month: string; amount: number }>;

    // Yearly spending (YYYY format)
    const yearlyResult = (await db.execute(sql`
      SELECT 
        DATE_FORMAT(created_at, '%Y') as year,
        COALESCE(SUM(total_amount), 0) as amount
      FROM bookings
      WHERE user_id = ${userId}
        AND status IN ('ACTIVE', 'COMPLETED')
      GROUP BY DATE_FORMAT(created_at, '%Y')
      ORDER BY year DESC
    `)) as any[] as Array<{ year: string; amount: number }>;

    // Facility-wise spending
    const facilityResult = (await db.execute(sql`
      SELECT 
        b.facility_id as facilityId,
        f.name as facilityName,
        COALESCE(SUM(b.total_amount), 0) as amount
      FROM bookings b
      INNER JOIN facilities f ON b.facility_id = f.id
      WHERE b.user_id = ${userId}
        AND b.status IN ('ACTIVE', 'COMPLETED')
      GROUP BY b.facility_id, f.name
      ORDER BY amount DESC
    `)) as any[] as Array<{ facilityId: string; facilityName: string; amount: number }>;

    // Category-wise spending
    const categoryResult = (await db.execute(sql`
      SELECT 
        c.id as categoryId,
        c.name as categoryName,
        COALESCE(SUM(b.total_amount), 0) as amount
      FROM bookings b
      INNER JOIN facilities f ON b.facility_id = f.id
      INNER JOIN categories c ON f.category_id = c.id
      WHERE b.user_id = ${userId}
        AND b.status IN ('ACTIVE', 'COMPLETED')
      GROUP BY c.id, c.name
      ORDER BY amount DESC
    `)) as any[] as Array<{ categoryId: number; categoryName: string; amount: number }>;

    return {
      totalSpending,
      monthlySpending: monthlyResult.map((r) => ({
        month: r.month,
        amount: Number(r.amount),
      })),
      yearlySpending: yearlyResult.map((r) => ({
        year: r.year,
        amount: Number(r.amount),
      })),
      facilityWiseSpending: facilityResult.map((r) => ({
        facilityId: r.facilityId,
        facilityName: r.facilityName,
        amount: Number(r.amount),
      })),
      categoryWiseSpending: categoryResult.map((r) => ({
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        amount: Number(r.amount),
      })),
    };
  }

  static async getUserAttendance(userId: string) {
    // Get all attendance records with booking info
    const attendanceRecords = await db
      .select({
        date: attendance.date,
        facilityId: attendance.facilityId,
        categoryId: facilities.categoryId,
      })
      .from(attendance)
      .innerJoin(bookings, eq(attendance.bookingId, bookings.id))
      .innerJoin(facilities, eq(attendance.facilityId, facilities.id))
      .where(eq(bookings.userId, userId))
      .orderBy(attendance.date);

    return attendanceRecords;
  }

  
  static async getCategoryWiseVisits(userId: string) {
    const result = (await db.execute(sql`
      SELECT 
        c.id as categoryId,
        c.name as categoryName,
        COUNT(a.id) as visits
      FROM attendance a
      INNER JOIN bookings b ON a.booking_id = b.id
      INNER JOIN facilities f ON a.facility_id = f.id
      INNER JOIN categories c ON f.category_id = c.id
      WHERE b.user_id = ${userId}
      GROUP BY c.id, c.name
      ORDER BY visits DESC
    `)) as any[] as Array<{ categoryId: number; categoryName: string; visits: number }>;

    return result.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      visits: Number(r.visits),
    }));
  }
  
  static async getCategoryInsights(userId: string) {
    // Get all categories with their insights
    const result = (await db.execute(sql`
      SELECT 
        c.id as categoryId,
        c.name as categoryName,
        COALESCE(visit_counts.visits, 0) as totalVisits,
        COALESCE(spend_counts.totalSpend, 0) as totalSpend,
        most_visited.facility_id as mostVisitedFacilityId,
        most_visited.facility_name as mostVisitedFacilityName,
        most_visited.visits as mostVisitedFacilityVisits
      FROM categories c
      LEFT JOIN (
        SELECT 
          f.category_id,
          COUNT(a.id) as visits
        FROM attendance a
        INNER JOIN bookings b ON a.booking_id = b.id
        INNER JOIN facilities f ON a.facility_id = f.id
        WHERE b.user_id = ${userId}
        GROUP BY f.category_id
      ) visit_counts ON c.id = visit_counts.category_id
      LEFT JOIN (
        SELECT 
          f.category_id,
          SUM(b.total_amount) as totalSpend
        FROM bookings b
        INNER JOIN facilities f ON b.facility_id = f.id
        WHERE b.user_id = ${userId}
          AND b.status IN ('ACTIVE', 'COMPLETED')
        GROUP BY f.category_id
      ) spend_counts ON c.id = spend_counts.category_id
      LEFT JOIN (
        SELECT 
          f.category_id,
          f.id as facility_id,
          f.name as facility_name,
          COUNT(a.id) as visits,
          ROW_NUMBER() OVER (PARTITION BY f.category_id ORDER BY COUNT(a.id) DESC) as rn
        FROM attendance a
        INNER JOIN bookings b ON a.booking_id = b.id
        INNER JOIN facilities f ON a.facility_id = f.id
        WHERE b.user_id = ${userId}
        GROUP BY f.category_id, f.id, f.name
      ) most_visited ON c.id = most_visited.category_id AND most_visited.rn = 1
      WHERE visit_counts.visits > 0 OR spend_counts.totalSpend > 0
      ORDER BY c.name
    `)) as any[] as Array<{
      categoryId: number;
      categoryName: string;
      totalVisits: number;
      totalSpend: number;
      mostVisitedFacilityId: string | null;
      mostVisitedFacilityName: string | null;
      mostVisitedFacilityVisits: number | null;
    }>;

    return result.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      totalVisits: Number(r.totalVisits),
      totalSpend: Number(r.totalSpend),
      mostVisitedFacility:
        r.mostVisitedFacilityId && r.mostVisitedFacilityName
          ? {
              facilityId: r.mostVisitedFacilityId,
              facilityName: r.mostVisitedFacilityName,
              visits: Number(r.mostVisitedFacilityVisits || 0),
            }
          : null,
    }));
  }

  static async getPendingReviews(userId: string) {
    const result = await db.execute(sql`
      SELECT 
        b.id as bookingId,
        f.id as facilityId,
        f.name as facilityName,
        c.name as category,
        b.end_date as completedAt
      FROM bookings b
      INNER JOIN facilities f ON b.facility_id = f.id
      INNER JOIN categories c ON f.category_id = c.id
      LEFT JOIN reviews r ON r.booking_id = b.id
      WHERE b.user_id = ${userId}
        AND b.status = 'COMPLETED'
        AND r.id IS null
      ORDER BY b.end_date DESC
    `) as any[];

    return result;
  }

  static async getMyReviews(userId: string) {
    const result = await db.execute(sql`
      SELECT 
        r.id as reviewId,
        r.booking_id as bookingId,
        f.id as facilityId,
        f.name as facilityName,
        c.name as category,
        r.rating,
        r.comment,
        r.created_at as createdAt
      FROM reviews r
      INNER JOIN facilities f ON r.facility_id = f.id
      WHERE r.user_id = ${userId}
      ORDER BY r.created_at DESC
    `) as any[];

    return result;
  }
}

