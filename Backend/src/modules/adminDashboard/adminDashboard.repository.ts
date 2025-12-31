/**
 * @file adminDashboard.repository.ts
 * Database operations for Admin Dashboard module
 */

import { db } from "../../db";
import {
  users,
  facilities,
  bookings,
  categories,
  refreshTokens,
} from "../../db/schema";
import { eq, sql } from "drizzle-orm";

export class AdminDashboardRepository {
  /**
   * Get dashboard overview metrics
   */
  static async getOverview() {
    // Subscription earnings from payments where entityType = SUBSCRIPTION
    const subscriptionEarningsResult = (await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE entity_type = 'SUBSCRIPTION' AND status = 'CAPTURED'
    `)) as any[] as Array<{ total: number }>;

    const subscriptionEarnings = Number(
      subscriptionEarningsResult[0]?.total || 0
    );

    // Platform fee earnings from completed bookings
    const platformFeeResult = (await db.execute(sql`
      SELECT COALESCE(SUM(platform_fee), 0) as total
      FROM bookings
      WHERE status = 'COMPLETED'
    `)) as any[] as Array<{ total: number }>;

    const platformFeeEarnings = Number(platformFeeResult[0]?.total || 0);

    // Total revenue = subscription + platform fees
    const totalRevenue = subscriptionEarnings + platformFeeEarnings;

    // Count owners
    const ownersCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.role, "OWNER"));

    // Count users
    const usersCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.role, "USER"));

    // Count facilities
    const facilitiesCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(facilities);

    // Count bookings
    const bookingsCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(bookings);

    // Escrow held
    const escrowHeldResult = (await db.execute(sql`
      SELECT COALESCE(SUM(amount_held), 0) as total
      FROM escrows
      WHERE status = 'HELD'
    `)) as any[] as Array<{ total: number }>;

    const escrowHeld = Number(escrowHeldResult[0]?.total || 0);

    return {
      totalRevenue,
      subscriptionEarnings,
      platformFeeEarnings,
      totalOwners: Number(ownersCount[0]?.count || 0),
      totalUsers: Number(usersCount[0]?.count || 0),
      totalFacilities: Number(facilitiesCount[0]?.count || 0),
      totalBookings: Number(bookingsCount[0]?.count || 0),
      escrowHeld,
    };
  }

  /**
   * Get monthly revenue breakdown for a year
   */
  static async getMonthlyRevenue(year: string) {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Get subscription revenue by month
    const subscriptionRevenue = (await db.execute(sql`
      SELECT 
        DATE_FORMAT(created_at, '%m') as monthNum,
        COALESCE(SUM(amount), 0) as revenue
      FROM payments
      WHERE entity_type = 'SUBSCRIPTION' 
        AND status = 'CAPTURED'
        AND YEAR(created_at) = ${year}
      GROUP BY DATE_FORMAT(created_at, '%m')
    `)) as any[] as Array<{ monthNum: string; revenue: number }>;

    // Get platform fee revenue by month from completed bookings
    const platformFeeRevenue = (await db.execute(sql`
      SELECT 
        DATE_FORMAT(created_at, '%m') as monthNum,
        COALESCE(SUM(platform_fee), 0) as revenue
      FROM bookings
      WHERE status = 'COMPLETED'
        AND YEAR(created_at) = ${year}
      GROUP BY DATE_FORMAT(created_at, '%m')
    `)) as any[] as Array<{ monthNum: string; revenue: number }>;

    // Create maps for quick lookup
    const subMap = new Map<string, number>();
    subscriptionRevenue.forEach((r) => {
      subMap.set(r.monthNum, Number(r.revenue));
    });

    const platformMap = new Map<string, number>();
    platformFeeRevenue.forEach((r) => {
      platformMap.set(r.monthNum, Number(r.revenue));
    });

    // Build monthly data array
    const monthlyData = months.map((monthName, index) => {
      const monthNum = String(index + 1).padStart(2, "0");
      const subRev = subMap.get(monthNum) || 0;
      const platformRev = platformMap.get(monthNum) || 0;
      return {
        month: monthName,
        totalRevenue: subRev + platformRev,
        subscriptionRevenue: subRev,
        platformFeeRevenue: platformRev,
      };
    });

    return {
      year,
      monthlyData,
    };
  }

  /**
   * Get revenue by category (baseAmount from bookings, not platform fee)
   */
  static async getRevenueByCategory() {
    const result = (await db.execute(sql`
      SELECT 
        c.name as category,
        COALESCE(SUM(b.base_amount), 0) as totalRevenue,
        COUNT(b.id) as bookingCount
      FROM categories c
      LEFT JOIN facilities f ON c.id = f.category_id
      LEFT JOIN bookings b ON f.id = b.facility_id AND b.status = 'COMPLETED'
      GROUP BY c.id, c.name
      ORDER BY totalRevenue DESC
    `)) as any[] as Array<{
      category: string;
      totalRevenue: number;
      bookingCount: number;
    }>;

    return result.map((r) => ({
      category: r.category,
      totalRevenue: Number(r.totalRevenue),
      bookingCount: Number(r.bookingCount),
    }));
  }

  /**
   * Get owners list with pagination and search
   */
  static async getOwnersList(
    search?: string,
    category?: string,
    page: number = 1,
    limit: number = 20
  ) {
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    let whereConditions = sql`u.role = 'OWNER'`;

    if (search) {
      whereConditions = sql`${whereConditions} AND (
        u.name LIKE ${`%${search}%`} OR 
        u.email LIKE ${`%${search}%`}
      )`;
    }

    if (category) {
      whereConditions = sql`${whereConditions} AND EXISTS (
        SELECT 1 FROM facilities f
        INNER JOIN categories c ON f.category_id = c.id
        WHERE f.owner_id = u.id AND c.name = ${category}
      )`;
    }

    // Get owners with aggregated data
    const owners = (await db.execute(sql`
      SELECT 
        u.id as ownerId,
        u.name as ownerName,
        u.email,
        u.city,
        (SELECT GROUP_CONCAT(DISTINCT c2.name ORDER BY c2.name SEPARATOR ',')
         FROM facilities f2
         INNER JOIN categories c2 ON f2.category_id = c2.id
         WHERE f2.owner_id = u.id) as categories,
        COUNT(DISTINCT f.id) as totalFacilities,
        COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN b.base_amount ELSE 0 END), 0) as totalRevenue
      FROM users u
      LEFT JOIN facilities f ON u.id = f.owner_id
      LEFT JOIN bookings b ON f.id = b.facility_id
      WHERE ${whereConditions}
      GROUP BY u.id, u.name, u.email, u.city
      ORDER BY u.name
      LIMIT ${limit} OFFSET ${offset}
    `)) as any[] as Array<{
      ownerId: string;
      ownerName: string;
      email: string;
      city: string | null;
      categories: string | null;
      totalFacilities: number;
      totalRevenue: number;
    }>;

    // Get total count
    const totalResult = (await db.execute(sql`
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      WHERE ${whereConditions}
    `)) as any[] as Array<{ total: number }>;

    const total = Number(totalResult[0]?.total || 0);

    return {
      owners: owners.map((o) => ({
        ownerId: o.ownerId,
        ownerName: o.ownerName,
        email: o.email,
        city: o.city,
        categories: o.categories ? o.categories.split(",") : [],
        totalFacilities: Number(o.totalFacilities),
        totalRevenue: Number(o.totalRevenue),
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Get owner details by ID
   */
  static async getOwnerDetails(ownerId: string) {
    // Get owner summary
    const ownerSummary = (await db.execute(sql`
      SELECT 
        u.name,
        u.email,
        u.city,
        COUNT(DISTINCT f.id) as totalFacilities,
        COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN b.base_amount ELSE 0 END), 0) as totalRevenue,
        COALESCE(SUM(CASE WHEN e.status = 'HELD' THEN e.amount_held ELSE 0 END), 0) as pendingPayout
      FROM users u
      LEFT JOIN facilities f ON u.id = f.owner_id
      LEFT JOIN bookings b ON f.id = b.facility_id
      LEFT JOIN escrows e ON b.id = e.booking_id
      WHERE u.id = ${ownerId} AND u.role = 'OWNER'
      GROUP BY u.id, u.name, u.email, u.city
    `)) as any[] as Array<{
      name: string;
      email: string;
      city: string | null;
      totalFacilities: number;
      totalRevenue: number;
      pendingPayout: number;
    }>;

    if (ownerSummary.length === 0) {
      return null;
    }

    const summary = ownerSummary[0];

    // Get facilities
    const facilitiesList = await db
      .select({
        facilityId: facilities.id,
        name: facilities.name,
        categoryName: categories.name,
        isPublished: facilities.isPublished,
      })
      .from(facilities)
      .innerJoin(categories, eq(facilities.categoryId, categories.id))
      .where(eq(facilities.ownerId, ownerId));

    return {
      ownerSummary: {
        name: summary.name,
        email: summary.email,
        city: summary.city,
        totalFacilities: Number(summary.totalFacilities),
        totalRevenue: Number(summary.totalRevenue),
        pendingPayout: Number(summary.pendingPayout),
      },
      facilities: facilitiesList.map((f) => ({
        facilityId: f.facilityId,
        name: f.name,
        category: f.categoryName,
        isPublished: f.isPublished,
      })),
    };
  }

  /**
   * Get users list with pagination and search
   */
  static async getUsersList(
    search?: string,
    page: number = 1,
    limit: number = 20
  ) {
    const offset = (page - 1) * limit;

    let whereConditions = sql`u.role = 'USER'`;

    if (search) {
      whereConditions = sql`${whereConditions} AND (
        u.name LIKE ${`%${search}%`} OR 
        u.email LIKE ${`%${search}%`}
      )`;
    }

    const users = (await db.execute(sql`
      SELECT 
        u.id as userId,
        u.name,
        u.email,
        u.city,
        COUNT(DISTINCT b.id) as totalBookings,
        (SELECT GROUP_CONCAT(DISTINCT c2.name ORDER BY c2.name SEPARATOR ',')
         FROM bookings b2
         INNER JOIN facilities f2 ON b2.facility_id = f2.id
         INNER JOIN categories c2 ON f2.category_id = c2.id
         WHERE b2.user_id = u.id) as categoriesUsed,
        COALESCE(SUM(CASE WHEN b.status IN ('ACTIVE', 'COMPLETED') THEN b.total_amount ELSE 0 END), 0) as totalSpent
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      WHERE ${whereConditions}
      GROUP BY u.id, u.name, u.email, u.city
      ORDER BY u.name
      LIMIT ${limit} OFFSET ${offset}
    `)) as any[] as Array<{
      userId: string;
      name: string;
      email: string;
      city: string | null;
      totalBookings: number;
      categoriesUsed: string | null;
      totalSpent: number;
    }>;

    const totalResult = (await db.execute(sql`
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      WHERE ${whereConditions}
    `)) as any[] as Array<{ total: number }>;

    const total = Number(totalResult[0]?.total || 0);

    return {
      users: users.map((u) => ({
        userId: u.userId,
        name: u.name,
        email: u.email,
        city: u.city,
        totalBookings: Number(u.totalBookings),
        categoriesUsed: u.categoriesUsed ? u.categoriesUsed.split(",") : [],
        totalSpent: Number(u.totalSpent),
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Get user details by ID
   */
  static async getUserDetails(userId: string) {
    // Get user summary
    const userSummary = (await db.execute(sql`
      SELECT 
        u.name,
        u.email,
        u.city,
        COUNT(DISTINCT b.id) as totalPasses,
        COALESCE(SUM(CASE WHEN b.status IN ('ACTIVE', 'COMPLETED') THEN b.total_amount ELSE 0 END), 0) as totalSpent
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      WHERE u.id = ${userId} AND u.role = 'USER'
      GROUP BY u.id, u.name, u.email, u.city
    `)) as any[] as Array<{
      name: string;
      email: string;
      city: string | null;
      totalPasses: number;
      totalSpent: number;
    }>;

    if (userSummary.length === 0) {
      return null;
    }

    const summary = userSummary[0];

    // Get categories used
    const categoriesUsed = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
      })
      .from(categories)
      .innerJoin(facilities, eq(categories.id, facilities.categoryId))
      .innerJoin(bookings, eq(facilities.id, bookings.facilityId))
      .where(eq(bookings.userId, userId))
      .groupBy(categories.id, categories.name);

    // Get booking history
    const bookingHistory = await db
      .select({
        facilityName: facilities.name,
        passDays: bookings.passDays,
        startDate: bookings.startDate,
        amount: bookings.totalAmount,
        status: bookings.status,
      })
      .from(bookings)
      .innerJoin(facilities, eq(bookings.facilityId, facilities.id))
      .where(eq(bookings.userId, userId))
      .orderBy(bookings.createdAt);

    return {
      userSummary: {
        name: summary.name,
        email: summary.email,
        city: summary.city,
        totalPasses: Number(summary.totalPasses),
        totalSpent: Number(summary.totalSpent),
      },
      categoriesUsed: categoriesUsed.map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
      })),
      bookingHistory: bookingHistory.map((b) => ({
        facilityName: b.facilityName,
        passDays: b.passDays,
        startDate: b.startDate,
        amount: Number(b.amount),
        status: b.status as
          | "PENDING"
          | "ACCEPTED"
          | "ACTIVE"
          | "COMPLETED"
          | "CANCELLED"
          | "DISPUTED",
      })),
    };
  }

  /**
   * Get escrow overview
   */
  static async getEscrowOverview() {
    const result = (await db.execute(sql`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'HELD' THEN amount_held ELSE 0 END), 0) as totalHeld,
        COALESCE(SUM(CASE WHEN status = 'RELEASED' THEN amount_held ELSE 0 END), 0) as totalReleased,
        COALESCE(SUM(CASE WHEN status = 'PAUSED' THEN amount_held ELSE 0 END), 0) as totalBlocked
      FROM escrows
    `)) as any[] as Array<{
      totalHeld: number;
      totalReleased: number;
      totalBlocked: number;
    }>;

    return {
      totalHeld: Number(result[0]?.totalHeld || 0),
      totalReleased: Number(result[0]?.totalReleased || 0),
      totalBlocked: Number(result[0]?.totalBlocked || 0),
    };
  }

  /**
   * Get escrow transactions grouped by date
   */
  static async getEscrowTransactions(fromDate?: string, toDate?: string) {
    let whereClause = sql`e.status = 'RELEASED' AND e.released_at IS NOT NULL`;

    if (fromDate) {
      whereClause = sql`${whereClause} AND DATE(e.released_at) >= ${fromDate}`;
    }

    if (toDate) {
      whereClause = sql`${whereClause} AND DATE(e.released_at) <= ${toDate}`;
    }

    // Get all released escrows with owner and booking details
    const transactions = (await db.execute(sql`
      SELECT 
        DATE(e.released_at) as date,
        e.owner_id as ownerId,
        u.name as ownerName,
        e.amount_held as amountReleased,
        b.id as bookingId,
        usr.name as userName,
        usr.email as userEmail,
        f.name as facilityName,
        c.name as category,
        b.pass_days as passDays,
        b.start_date as startDate,
        b.end_date as endDate,
        e.amount_held as amount
      FROM escrows e
      INNER JOIN users u ON e.owner_id = u.id
      INNER JOIN bookings b ON e.booking_id = b.id
      INNER JOIN users usr ON b.user_id = usr.id
      INNER JOIN facilities f ON b.facility_id = f.id
      INNER JOIN categories c ON f.category_id = c.id
      WHERE ${whereClause}
      ORDER BY e.released_at DESC
    `)) as any[] as Array<{
      date: Date;
      ownerId: string;
      ownerName: string;
      amountReleased: number;
      bookingId: string;
      userName: string;
      userEmail: string;
      facilityName: string;
      category: string;
      passDays: number;
      startDate: Date;
      endDate: Date;
      amount: number;
    }>;

    // Group by date and owner
    const dateMap = new Map<
      string,
      Map<
        string,
        {
          ownerId: string;
          ownerName: string;
          amountReleased: number;
          bookings: Array<{
            userName: string;
            userEmail: string;
            facilityName: string;
            category: string;
            passDays: number;
            startDate: Date;
            endDate: Date;
            amount: number;
          }>;
        }
      >
    >();

    for (const txn of transactions) {
      const dateStr = txn.date.toISOString().split("T")[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, new Map());
      }

      const ownerMap = dateMap.get(dateStr)!;
      if (!ownerMap.has(txn.ownerId)) {
        ownerMap.set(txn.ownerId, {
          ownerId: txn.ownerId,
          ownerName: txn.ownerName,
          amountReleased: 0,
          bookings: [],
        });
      }

      const ownerData = ownerMap.get(txn.ownerId)!;
      ownerData.amountReleased += Number(txn.amountReleased);
      ownerData.bookings.push({
        userName: txn.userName,
        userEmail: txn.userEmail,
        facilityName: txn.facilityName,
        category: txn.category,
        passDays: Number(txn.passDays),
        startDate: txn.startDate,
        endDate: txn.endDate,
        amount: Number(txn.amount),
      });
    }

    // Convert to array format
    const result = Array.from(dateMap.entries())
      .map(([date, ownerMap]) => ({
        date,
        owners: Array.from(ownerMap.values()),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return { transactions: result };
  }

  /**
   * Get platform earnings analytics
   */
  static async getPlatformEarnings() {
    // Total platform earning = platform fees from completed bookings
    const totalResult = await db.execute(sql`
      SELECT 
        COALESCE(SUM(platform_fee), 0) as total,
        COUNT(*) as transactions
      FROM escrows
      WHERE status = 'RELEASED'
    `) as any[];

    const totalPlatformEarning = Number(totalResult[0]?.total || 0);
    const totalTransactions = Number(totalResult[0]?.transactions || 0);

    // Monthly earning
    const monthlyEarning = await db.execute(sql`
      SELECT 
        DATE_FORMAT(released_at, '%Y-%m') as month,
        COALESCE(SUM(platform_fee), 0) as amount
      FROM escrows
      WHERE status = 'RELEASED'
      GROUP BY DATE_FORMAT(released_at, '%Y-%m')
      ORDER BY month DESC
    `) as any[];

    // Yearly earning
    const yearlyEarning = await db.execute(sql`
      SELECT 
        DATE_FORMAT(released_at, '%Y') as year,
        COALESCE(SUM(platform_fee), 0) as amount
      FROM escrows
      WHERE status = 'RELEASED'
      GROUP BY DATE_FORMAT(released_at, '%Y')
      ORDER BY year DESC
    `) as any[];

    // Calculate monthly average
    const monthlyAverage =
      monthlyEarning.length > 0
        ? Math.round(
            monthlyEarning.reduce((sum, m) => sum + Number(m.amount), 0) /
              monthlyEarning.length
          )
        : 0;

    // Revenue by category (platform fee only)
    const revenueByCategory = (await db.execute(sql`
      SELECT 
        c.name as category,
        COALESCE(SUM(b.platform_fee), 0) as platformFeeRevenue
      FROM categories c
      LEFT JOIN facilities f ON c.id = f.category_id
      LEFT JOIN bookings b ON f.id = b.facility_id AND b.status = 'COMPLETED'
      GROUP BY c.id, c.name
      ORDER BY platformFeeRevenue DESC
    `)) as any[] as Array<{ category: string; platformFeeRevenue: number }>;

    return {
      totalPlatformEarning,
      monthlyEarning,
      yearlyEarning,
      monthlyAverage,
      totalTransactions,
      revenueByCategory: revenueByCategory.map((r) => ({
        category: r.category,
        platformFeeRevenue: Number(r.platformFeeRevenue),
      })),
    };
  }

  static async blockUser(userId: string) {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ accountStatus: "SUSPENDED" })
        .where(eq(users.id, userId));

      await tx
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId, userId));
    });
  }

  static async blockOwner(ownerId: string) {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ accountStatus: "SUSPENDED" })
        .where(eq(users.id, ownerId));

      await tx
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId, ownerId));

      // Unpublish owner facilities
      await tx.execute(sql`
        UPDATE facilities
        SET is_published = false
        WHERE owner_id = ${ownerId}
      `);
    });
  }
}

