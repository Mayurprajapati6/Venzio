import { db } from "../../db";
import { facilities } from "../../db/schema";
import { eq,  sql } from "drizzle-orm";

export class OwnerDashboardRepository {
  
  static async getOwnerFacilityIds(ownerId: string): Promise<string[]> {
    const facilitiesList = await db
      .select({ id: facilities.id })
      .from(facilities)
      .where(eq(facilities.ownerId, ownerId));

    return facilitiesList.map((f) => f.id);
  }

  
  static async getRevenueAnalytics(ownerId: string) {

    
    const [overall] = await db.execute(sql`
      SELECT
        COALESCE(
          SUM(
            CASE 
              WHEN e.status = 'RELEASED'
              THEN (e.amount_held - e.platform_fee)
              ELSE 0
            END
          ),
          0
        ) AS totalLifetimeEarning,
        COUNT(DISTINCT b.id) AS totalBookingsCount
      FROM bookings b
      INNER JOIN facilities f ON b.facility_id = f.id
      LEFT JOIN escrows e ON b.id = e.booking_id
      WHERE f.owner_id = ${ownerId}
    `) as any[];

    
    const yearMonthRows = await db.execute(sql`
      SELECT
        DATE_FORMAT(b.created_at, '%Y') AS year,
        DATE_FORMAT(b.created_at, '%Y-%m') AS month,
        COUNT(b.id) AS bookings,
        COALESCE(
          SUM(
            CASE 
              WHEN e.status = 'RELEASED'
              THEN (e.amount_held - e.platform_fee)
              ELSE 0
            END
          ),
          0
        ) AS revenue
      FROM bookings b
      INNER JOIN facilities f ON b.facility_id = f.id
      LEFT JOIN escrows e ON b.id = e.booking_id
      WHERE f.owner_id = ${ownerId}
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `) as any[];

    const yearMap = new Map<string, any[]>();

    for (const row of yearMonthRows) {
      if (!yearMap.has(row.year)) {
        yearMap.set(row.year, []);
      }
      yearMap.get(row.year)!.push({
        month: row.month,
        revenue: Number(row.revenue),
        bookings: Number(row.bookings),
      });
    }

    const yearWiseBreakdown = Array.from(yearMap.entries()).map(
      ([year, months]) => ({ year, months })
    );

    
    const facilityRows = await db.execute(sql`
      SELECT
        f.id AS facilityId,
        f.name AS facilityName,
        COUNT(b.id) AS totalBookings,
        COALESCE(SUM(b.total_amount), 0) AS totalUserPaid,
        COALESCE(SUM(e.platform_fee), 0) AS totalPlatformFee,
        COALESCE(
          SUM(
            CASE 
              WHEN e.status = 'RELEASED'
              THEN (e.amount_held - e.platform_fee)
              ELSE 0
            END
          ),
          0
        ) AS totalOwnerEarning
      FROM facilities f
      LEFT JOIN bookings b ON f.id = b.facility_id
      LEFT JOIN escrows e ON b.id = e.booking_id
      WHERE f.owner_id = ${ownerId}
      GROUP BY f.id, f.name
    `) as any[];

    const facilityWiseBreakdown = facilityRows.map((r) => ({
      facilityId: r.facilityId,
      facilityName: r.facilityName,
      totalUserPaid: Number(r.totalUserPaid),
      totalPlatformFee: Number(r.totalPlatformFee),
      totalOwnerEarning: Number(r.totalOwnerEarning),
      totalBookings: Number(r.totalBookings),
    }));

    
    return {
      overallSummary: {
        totalLifetimeEarning: Number(overall.totalLifetimeEarning),
        totalBookingsCount: Number(overall.totalBookingsCount),
      },
      yearWiseBreakdown,
      facilityWiseBreakdown,
    };
  }

  
  static async getPayouts(ownerId: string) {
    const payouts = (await db.execute(sql`
      SELECT 
        e.id as escrowId,
        e.amount_held as amountHeld,
        e.platform_fee as platformFee,
        e.status as payoutStatus,
        e.released_at as releasedAt,
        e.release_date as releaseDate,
        u.name as userName,
        u.email as userEmail,
        f.name as facilityName,
        c.name as categoryName,
        b.slot_type as slotType,
        b.pass_days as passDays,
        b.start_date as startDate,
        b.end_date as endDate,
        b.total_amount as bookingTotalAmount
      FROM escrows e
      INNER JOIN bookings b ON e.booking_id = b.id
      INNER JOIN facilities f ON b.facility_id = f.id
      INNER JOIN categories c ON f.category_id = c.id
      INNER JOIN users u ON b.user_id = u.id
      WHERE e.owner_id = ${ownerId}
      ORDER BY COALESCE(e.released_at, e.release_date) DESC, b.created_at DESC
    `)) as any[] as Array<{
      escrowId: string;
      amountHeld: number;
      platformFee: number;
      payoutStatus: string;
      releasedAt: Date | null;
      releaseDate: Date;
      userName: string;
      userEmail: string;
      facilityName: string;
      categoryName: string;
      slotType: string;
      passDays: number;
      startDate: Date;
      endDate: Date;
      bookingTotalAmount: number;
    }>;

    return payouts.map((p) => ({
      escrowId: p.escrowId,
      payoutAmount: p.payoutStatus === "RELEASED" 
        ? Number(p.amountHeld) - Number(p.platformFee)
        : Number(p.amountHeld),
      payoutStatus: p.payoutStatus as "HELD" | "RELEASED" | "PAUSED" | "REFUNDED",
      payoutDate: p.releasedAt || p.releaseDate,
      platformFee: Number(p.platformFee),
      userDetails: {
        userName: p.userName,
        userEmail: p.userEmail,
        facilityName: p.facilityName,
        category: p.categoryName,
        slotType: p.slotType as "MORNING" | "AFTERNOON" | "EVENING",
        passDays: Number(p.passDays),
        startDate: p.startDate,
        endDate: p.endDate,
        bookingTotalAmount: Number(p.bookingTotalAmount),
      },
    }));
  }

  
  static async getCheckIns(ownerId: string) {
    const facilityIds = await this.getOwnerFacilityIds(ownerId);

    if (facilityIds.length === 0) {
      return {
        todaysCheckIns: [],
        yesterdaysCheckIns: [],
        last7DaysSummary: [],
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Today's check-ins
    const todaysCheckIns = (await db.execute(sql`
      SELECT 
        a.id as checkInId,
        u.name as userName,
        f.name as facilityName,
        a.date as checkInTime,
        b.slot_type as slotType
      FROM attendance a
      INNER JOIN bookings b ON a.booking_id = b.id
      INNER JOIN facilities f ON a.facility_id = f.id
      INNER JOIN users u ON b.user_id = u.id
      WHERE f.owner_id = ${ownerId}
        AND DATE(a.date) = DATE(${today})
      ORDER BY a.date DESC
    `)) as any[] as Array<{
      checkInId: string;
      userName: string;
      facilityName: string;
      checkInTime: Date;
      slotType: string;
    }>;

    // Yesterday's check-ins
    const yesterdaysCheckIns = (await db.execute(sql`
      SELECT 
        a.id as checkInId,
        u.name as userName,
        f.name as facilityName,
        a.date as checkInTime,
        b.slot_type as slotType
      FROM attendance a
      INNER JOIN bookings b ON a.booking_id = b.id
      INNER JOIN facilities f ON a.facility_id = f.id
      INNER JOIN users u ON b.user_id = u.id
      WHERE f.owner_id = ${ownerId}
        AND DATE(a.date) = DATE(${yesterday})
      ORDER BY a.date DESC
    `)) as any[] as Array<{
      checkInId: string;
      userName: string;
      facilityName: string;
      checkInTime: Date;
      slotType: string;
    }>;

    // Last 7 days summary
    const last7DaysSummary = (await db.execute(sql`
      SELECT 
        DATE(a.date) as date,
        COUNT(a.id) as count
      FROM attendance a
      INNER JOIN bookings b ON a.booking_id = b.id
      INNER JOIN facilities f ON a.facility_id = f.id
      WHERE f.owner_id = ${ownerId}
        AND DATE(a.date) >= DATE(${sevenDaysAgo})
        AND DATE(a.date) < DATE(${today})
      GROUP BY DATE(a.date)
      ORDER BY date DESC
    `)) as any[] as Array<{
      date: Date;
      count: number;
    }>;

    return {
      todaysCheckIns: todaysCheckIns.map((c) => ({
        checkInId: c.checkInId,
        userName: c.userName,
        facilityName: c.facilityName,
        checkInTime: c.checkInTime,
        slotType: c.slotType as "MORNING" | "AFTERNOON" | "EVENING",
      })),
      yesterdaysCheckIns: yesterdaysCheckIns.map((c) => ({
        checkInId: c.checkInId,
        userName: c.userName,
        facilityName: c.facilityName,
        checkInTime: c.checkInTime,
        slotType: c.slotType as "MORNING" | "AFTERNOON" | "EVENING",
      })),
      last7DaysSummary: last7DaysSummary.map((s) => ({
        date: s.date.toISOString().split("T")[0],
        count: Number(s.count),
      })),
    };
  }

   static async getFacilityReviews(ownerId: string, facilityId: string) {
    const rows = await db.execute(sql`
      SELECT
        r.id as reviewId,
        u.name as userName,
        r.rating,
        r.comment,
        r.created_at as createdAt,
        f.name as facilityName
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN facilities f ON r.facility_id = f.id
      WHERE f.owner_id = ${ownerId}
        AND f.id = ${facilityId}
      ORDER BY r.created_at DESC
    `) as any[];

    return {
      facilityId,
      facilityName: rows[0]?.facilityName || "",
      reviews: rows.map(r => ({
        reviewId: r.reviewId,
        userName: r.userName,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    };
  }

  static async getFacilityUsers(ownerId: string) {
    const facilityUsers = (await db.execute(sql`
      SELECT 
        f.id as facilityId,
        f.name as facilityName,
        b.id as bookingId,
        u.name as userName,
        u.email as userEmail,
        b.status as bookingStatus,
        b.pass_days as passDays,
        b.slot_type as slotType,
        b.start_date as startDate,
        b.end_date as endDate,
        DATE_ADD(b.end_date, INTERVAL 1 DAY) as payoutReleaseDate,
        b.total_amount as bookingAmount,
        e.platform_fee as platformFee,
        b.active_days_remaining as activeDaysRemaining
        CASE 
          WHEN e.status = 'RELEASED'
          THEN (e.amount_held - e.platform_fee)
          ELSE 0
        END as ownerEarning
      FROM facilities f
      INNER JOIN bookings b ON f.id = b.facility_id
      INNER JOIN users u ON b.user_id = u.id
      WHERE f.owner_id = ${ownerId}
      ORDER BY f.name, b.created_at DESC
    `)) as any[] 

    // Group by facility
    const facilityMap = new Map<string, any>();

    for (const row of facilityUsers) {
      if (!facilityMap.has(row.facilityId)) {
        facilityMap.set(row.facilityId, {
          facilityId: row.facilityId,
          facilityName: row.facilityName,
          bookings: [],
        });
      }

      facilityMap.get(row.facilityId)!.bookings.push({
        bookingId: row.bookingId,
        userName: row.userName,
        userEmail: row.userEmail,
        bookingStatus: row.bookingStatus,
        passDays: row.passDays,
        slotType: row.slotType,
        startDate: row.startDate,
        endDate: row.endDate,
        payoutReleaseDate: row.payoutReleaseDate,
        bookingAmount: Number(row.bookingAmount),
        platformFee: Number(row.platformFee || 0),
        ownerEarning: Number(row.ownerEarning || 0),
        activeDaysRemaining: Number(row.activeDaysRemaining),
      });
    }

    return Array.from(facilityMap.values());
  }

  
  static async getQuickCounts(ownerId: string) {
    // Get counts using subqueries
    const counts = (await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM facilities WHERE owner_id = ${ownerId}) as totalFacilities,
        (SELECT COUNT(*) FROM bookings WHERE facility_id IN (SELECT id FROM facilities WHERE owner_id = ${ownerId}) AND status IN ('ACCEPTED', 'ACTIVE')) as activeBookings,
        (SELECT COUNT(*) FROM bookings WHERE facility_id IN (SELECT id FROM facilities WHERE owner_id = ${ownerId}) AND status = 'COMPLETED') as completedBookings,
        (SELECT COUNT(*) FROM escrows WHERE owner_id = ${ownerId} AND status = 'HELD') as pendingPayouts,
        (SELECT COUNT(*) FROM escrows WHERE owner_id = ${ownerId} AND status = 'RELEASED') as releasedPayouts
    `)) as any[] as Array<{
      totalFacilities: number;
      activeBookings: number;
      completedBookings: number;
      pendingPayouts: number;
      releasedPayouts: number;
    }>;

    return {
      totalFacilities: Number(counts[0]?.totalFacilities || 0),
      activeBookings: Number(counts[0]?.activeBookings || 0),
      completedBookings: Number(counts[0]?.completedBookings || 0),
      pendingPayouts: Number(counts[0]?.pendingPayouts || 0),
      releasedPayouts: Number(counts[0]?.releasedPayouts || 0),
    };
  }
}

