export interface PassInfo {
  bookingId: string;
  facilityName: string;
  category: string;
  slotType: "MORNING" | "AFTERNOON" | "EVENING";
  startDate: Date;
  endDate: Date;
  activeDaysRemaining: number;
  qrCode: string | null;
  status: "PENDING" | "ACCEPTED" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "DISPUTED";
}

export interface PassesResponse {
  counts: {
    active: number;
    pending: number;
    completed: number;
  };
  activePasses: PassInfo[];
  expiredPasses: PassInfo[];
}

export interface MonthlySpending {
  month: string; // YYYY-MM format
  amount: number;
}

export interface YearlySpending {
  year: string; // YYYY format
  amount: number;
}

export interface FacilitySpending {
  facilityId: string;
  facilityName: string;
  amount: number;
}

export interface CategorySpending {
  categoryId: number;
  categoryName: string;
  amount: number;
}

export interface SpendingResponse {
  totalSpending: number;
  monthlySpending: MonthlySpending[];
  yearlySpending: YearlySpending[];
  facilityWiseSpending: FacilitySpending[];
  categoryWiseSpending: CategorySpending[];
}

export interface StreaksResponse {
  totalVisits: number;
  currentStreak: number;
  longestStreak: number;
  categoryWiseVisits: Array<{
    categoryId: number;
    categoryName: string;
    visits: number;
  }>;
}

export interface CategoryInsight {
  categoryId: number;
  categoryName: string;
  totalVisits: number;
  totalSpend: number;
  mostVisitedFacility: {
    facilityId: string;
    facilityName: string;
    visits: number;
  } | null;
}

export interface CategoriesResponse {
  categories: CategoryInsight[];
}

export interface PendingReview {
  bookingId: string;
  facilityId: string;
  facilityName: string;
  category: string;
  completedAt: Date;
}

export interface MyReview {
  reviewId: string;
  bookingId: string;
  facilityId: string;
  facilityName: string;
  category: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ReviewsDashboardResponse {
  pendingReviews: PendingReview[];
  myReviews: MyReview[];
}
