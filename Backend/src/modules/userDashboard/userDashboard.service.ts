import { UserDashboardRepository } from "./userDashboard.repository";
import type {
  PassesResponse,
  SpendingResponse,
  StreaksResponse,
  CategoriesResponse,
  PassInfo,
  PendingReview,
  MyReview,
} from "./userDashboard.types";

export class UserDashboardService {
  
  static async getPasses(userId: string): Promise<PassesResponse> {
    const bookings = await UserDashboardRepository.getUserPasses(userId);

    // Filter and categorize passes
    const activePasses: PassInfo[] = [];
    const expiredPasses: PassInfo[] = [];
    let activeCount = 0;
    let pendingCount = 0;
    let completedCount = 0;

    for (const booking of bookings) {
      const passInfo: PassInfo = {
        bookingId: booking.id,
        facilityName: booking.facilityName,
        category: booking.categoryName,
        slotType: booking.slotType,
        startDate: booking.startDate,
        endDate: booking.endDate,
        activeDaysRemaining: booking.activeDaysRemaining,
        qrCode:
          booking.status === "ACCEPTED" || booking.status === "ACTIVE"
            ? booking.qrCode
            : null, // Only expose QR for ACTIVE/ACCEPTED
        status: booking.status,
      };

      // Count by status
      if (booking.status === "PENDING") {
        pendingCount++;
      } else if (booking.status === "ACCEPTED" || booking.status === "ACTIVE") {
        activeCount++;
        activePasses.push(passInfo);
      } else if (booking.status === "COMPLETED") {
        completedCount++;
        expiredPasses.push(passInfo);
      }
    }

    return {
      counts: {
        active: activeCount,
        pending: pendingCount,
        completed: completedCount,
      },
      activePasses,
      expiredPasses,
    };
  }

  static async getSpending(userId: string): Promise<SpendingResponse> {
    return await UserDashboardRepository.getUserSpending(userId);
  }

  static calculateStreaks(attendanceDates: Date[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (attendanceDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort dates and remove duplicates, convert to date-only (ignore time)
    const uniqueDates = Array.from(
      new Set(
        attendanceDates.map((d) => {
          const date = new Date(d);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
      )
    )
      .map((timestamp) => new Date(timestamp))
      .sort((a, b) => a.getTime() - b.getTime());

    // Calculate longest streak
    let longestStreak = 1;
    let currentLongest = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = uniqueDates[i - 1];
      const currDate = uniqueDates[i];
      const diffDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        currentLongest++;
        longestStreak = Math.max(longestStreak, currentLongest);
      } else {
        currentLongest = 1;
      }
    }

    // Calculate current streak (from most recent date backwards)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (uniqueDates.length > 0) {
      // Start from the most recent attendance date
      const mostRecent = new Date(uniqueDates[uniqueDates.length - 1]);
      mostRecent.setHours(0, 0, 0, 0);
      
      const daysSinceMostRecent = Math.floor(
        (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
      );

      // If most recent attendance is more than 1 day ago, streak is broken
      if (daysSinceMostRecent > 1) {
        currentStreak = 0;
      } else {
        
        const dateSet = new Set(uniqueDates.map(d => {
          const date = new Date(d);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        }));
        
        let checkDate = new Date(mostRecent);
        
        // Count consecutive days backwards
        while (dateSet.has(checkDate.getTime())) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    }

    return {
      currentStreak,
      longestStreak,
    };
  }

  /**
   * Get streaks and visits
   */
  static async getStreaks(userId: string): Promise<StreaksResponse> {
    const attendanceRecords = await UserDashboardRepository.getUserAttendance(
      userId
    );
    const categoryWiseVisits =
      await UserDashboardRepository.getCategoryWiseVisits(userId);

    const attendanceDates = attendanceRecords.map((r) => r.date);
    const { currentStreak, longestStreak } =
      this.calculateStreaks(attendanceDates);

    return {
      totalVisits: attendanceRecords.length,
      currentStreak,
      longestStreak,
      categoryWiseVisits,
    };
  }

  /**
   * Get category insights
   */
  static async getCategories(userId: string): Promise<CategoriesResponse> {
    const insights = await UserDashboardRepository.getCategoryInsights(userId);

    return {
      categories: insights,
    };
  }

  static async getPendingReviews(userId: string): Promise<PendingReview[]> {
    return UserDashboardRepository.getPendingReviews(userId);
  }

  static async getMyReviews(userId: string): Promise<MyReview[]> {
    return UserDashboardRepository.getMyReviews(userId);
  }
}

