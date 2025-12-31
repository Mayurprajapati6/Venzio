import { AttendanceAnalyticsRepository } from "./attendanceAnalytics.repository";
import type {
  AttendanceCalendarResponse,
  StreaksResponse,
  MonthlyAttendanceResponse,
  YearlyAttendance,
  AttendanceDetailResponse,
} from "./attendanceAnalytics.types";
import { NotFoundError, BadRequestError } from "../../utils/errors/app.error";

export class AttendanceAnalyticsService {
  
  private static calculateStreaks(attendanceDates: Date[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (attendanceDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    
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

    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (uniqueDates.length > 0) {
      
      const mostRecent = new Date(uniqueDates[uniqueDates.length - 1]);
      mostRecent.setHours(0, 0, 0, 0);

      const daysSinceMostRecent = Math.floor(
        (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
      );

    
      if (daysSinceMostRecent > 1) {
        currentStreak = 0;
      } else {
        
        const dateSet = new Set(
          uniqueDates.map((d) => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
          })
        );

        let checkDate = new Date(mostRecent);

        
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

  
  static async getCalendar(
    userId: string,
    month: number,
    year: number
  ): Promise<AttendanceCalendarResponse> {
    if (month < 1 || month > 12) {
      throw new BadRequestError("Invalid month. Must be between 1 and 12");
    }

    if (year < 2000 || year > 3000) {
      throw new BadRequestError("Invalid year");
    }

    return await AttendanceAnalyticsRepository.getCalendar(userId, year, month);
  }

  static async getStreaks(userId: string): Promise<StreaksResponse> {
    const attendanceDates =
      await AttendanceAnalyticsRepository.getAttendanceDates(userId);

    const { currentStreak, longestStreak } =
      this.calculateStreaks(attendanceDates);

    
    const now = new Date();
    const currentMonth = now.toLocaleString("default", { month: "long" });
    const currentYear = String(now.getFullYear());

    
    const monthlyData = await AttendanceAnalyticsRepository.getMonthlyAttendance(
      userId,
      currentYear
    );
    const currentMonthData = monthlyData.monthlyData.find(
      (m) => m.month === currentMonth
    );

    const yearlyData =
      await AttendanceAnalyticsRepository.getYearlyAttendance(userId);
    const currentYearData = yearlyData.find((y) => y.year === currentYear);

    return {
      currentStreak,
      longestStreak,
      monthlyStreak: {
        month: currentMonth,
        count: currentMonthData?.attendanceCount || 0,
      },
      yearlyStreak: {
        year: currentYear,
        count: currentYearData?.attendanceCount || 0,
      },
    };
  }

  static async getMonthlyAttendance(
    userId: string,
    year: string
  ): Promise<MonthlyAttendanceResponse> {
    if (!/^\d{4}$/.test(year)) {
      throw new BadRequestError("Invalid year format. Must be YYYY");
    }

    return await AttendanceAnalyticsRepository.getMonthlyAttendance(
      userId,
      year
    );
  }

  static async getYearlyAttendance(
    userId: string
  ): Promise<YearlyAttendance[]> {
    return await AttendanceAnalyticsRepository.getYearlyAttendance(userId);
  }

  static async getAttendanceDetail(
    userId: string,
    date: string
  ): Promise<AttendanceDetailResponse> {
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestError("Invalid date format. Must be YYYY-MM-DD");
    }

    const detail = await AttendanceAnalyticsRepository.getAttendanceDetail(
      userId,
      date
    );

    if (!detail) {
      throw new NotFoundError("No attendance found for this date");
    }

    return detail;
  }
}

