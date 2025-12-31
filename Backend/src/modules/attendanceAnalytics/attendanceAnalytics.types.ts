export interface CalendarDay {
  date: string; // YYYY-MM-DD
  attended: boolean;
  facilityName?: string;
  category?: string;
  slotType?: "MORNING" | "AFTERNOON" | "EVENING";
}

export interface AttendanceCalendarResponse {
  year: number;
  month: number;
  days: CalendarDay[];
}

export interface StreaksResponse {
  currentStreak: number;
  longestStreak: number;
  monthlyStreak: {
    month: string;
    count: number;
  };
  yearlyStreak: {
    year: string;
    count: number;
  };
}

export interface MonthlyAttendance {
  month: string; // "January", "February", etc.
  attendanceCount: number;
}

export interface MonthlyAttendanceResponse {
  year: string;
  monthlyData: MonthlyAttendance[];
}

export interface YearlyAttendance {
  year: string; // YYYY
  attendanceCount: number;
}

export interface AttendanceDetailResponse {
  date: string; // YYYY-MM-DD
  facility: {
    name: string;
    category: string;
    city: string;
  };
  owner: {
    name: string;
    email: string;
  };
  booking: {
    passDays: number;
    slotType: "MORNING" | "AFTERNOON" | "EVENING";
    startDate: Date;
    endDate: Date;
  };
  markedByOwnerAt: string; // Formatted time like "10:30 AM"
}

