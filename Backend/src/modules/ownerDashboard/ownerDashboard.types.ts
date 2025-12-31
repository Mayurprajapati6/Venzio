/**
 * @file ownerDashboard.types.ts
 * Type definitions for Owner Dashboard module
 */

export interface RevenueOverallSummary {
  totalLifetimeEarning: number;
  totalBookingsCount: number;
}

export interface MonthlyRevenue {
  month: string; // YYYY-MM format
  revenue: number;
  bookings: number;
}

export interface YearWiseRevenue {
  year: string; // YYYY format
  months: MonthlyRevenue[];
}

export interface FacilityRevenue {
  facilityId: string;
  facilityName: string;
  totalUserPaid: number;
  totalPlatformFee: number;
  totalOwnerEarning: number; // RELEASED only
  totalBookings: number;
}

export interface RevenueResponse {
  overallSummary: RevenueOverallSummary;
  yearWiseBreakdown: YearWiseRevenue[];
  facilityWiseBreakdown: FacilityRevenue[];
}

export interface PayoutRecord {
  escrowId: string;
  payoutAmount: number; // amountHeld - platformFee (or just amountHeld for released)
  payoutStatus: "HELD" | "RELEASED" | "PAUSED" | "REFUNDED";
  payoutDate: Date | null; // releasedAt if RELEASED, releaseDate if HELD/PAUSED
  platformFee: number;
  userDetails: {
    userName: string;
    userEmail: string;
    facilityName: string;
    category: string;
    slotType: "MORNING" | "AFTERNOON" | "EVENING";
    passDays: number;
    startDate: Date;
    endDate: Date;
    bookingTotalAmount: number;
  };
}

export interface PayoutsResponse {
  payouts: PayoutRecord[];
}

export interface CheckInRecord {
  checkInId: string;
  userName: string;
  facilityName: string;
  checkInTime: Date;
  slotType: "MORNING" | "AFTERNOON" | "EVENING";
}

export interface CheckInsResponse {
  todaysCheckIns: CheckInRecord[];
  yesterdaysCheckIns: CheckInRecord[];
  last7DaysSummary: Array<{
    date: string; // YYYY-MM-DD format
    count: number;
  }>;
}

export interface FacilityUserBooking {
  bookingId: string;
  userName: string;
  userEmail: string;
  bookingStatus: "PENDING" | "ACCEPTED" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "DISPUTED";
  passDays: number;
  slotType: "MORNING" | "AFTERNOON" | "EVENING";
  startDate: Date;
  endDate: Date;
  payoutReleaseDate: Date; // endDate + 1
  bookingAmount: number;
  platformFee: number;
  ownerEarning: number;
  activeDaysRemaining: number;
}

export interface FacilityUsersResponse {
  facilities: Array<{
    facilityId: string;
    facilityName: string;
    bookings: FacilityUserBooking[];
  }>;
}

export interface FacilityReview {
  reviewId: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface FacilityReviewsResponse {
  facilityId: string;
  facilityName: string;
  reviews: FacilityReview[];
}

export interface QuickCountsResponse {
  totalFacilities: number;
  activeBookings: number;
  completedBookings: number;
  pendingPayouts: number;
  releasedPayouts: number;
}

