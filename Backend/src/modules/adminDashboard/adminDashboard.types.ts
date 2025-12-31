/**
 * @file adminDashboard.types.ts
 * Type definitions for Admin Dashboard module
 */

export interface DashboardOverview {
  totalRevenue: number;
  subscriptionEarnings: number;
  platformFeeEarnings: number;
  totalOwners: number;
  totalUsers: number;
  totalFacilities: number;
  totalBookings: number;
  escrowHeld: number;
}

export interface MonthlyRevenue {
  month: string; // "Jan", "Feb", etc.
  totalRevenue: number;
  subscriptionRevenue: number;
  platformFeeRevenue: number;
}

export interface MonthlyRevenueResponse {
  year: string;
  monthlyData: MonthlyRevenue[];
}

export interface CategoryRevenue {
  category: string;
  totalRevenue: number; // baseAmount, not platform fee
  bookingCount: number;
}

export interface OwnerListItem {
  ownerId: string;
  ownerName: string;
  email: string;
  city: string | null;
  categories: string[];
  totalFacilities: number;
  totalRevenue: number;
}

export interface OwnerListResponse {
  owners: OwnerListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface OwnerFacility {
  facilityId: string;
  name: string;
  category: string;
  isPublished: boolean;
}

export interface OwnerDetailsResponse {
  ownerSummary: {
    name: string;
    email: string;
    city: string | null;
    totalFacilities: number;
    totalRevenue: number;
    pendingPayout: number;
  };
  facilities: OwnerFacility[];
}

export interface UserListItem {
  userId: string;
  name: string;
  email: string;
  city: string | null;
  totalBookings: number;
  categoriesUsed: string[];
  totalSpent: number;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface UserCategory {
  categoryId: number;
  categoryName: string;
}

export interface UserBooking {
  facilityName: string;
  passDays: number;
  startDate: Date;
  amount: number;
  status: "PENDING" | "ACCEPTED" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "DISPUTED";
}

export interface UserDetailsResponse {
  userSummary: {
    name: string;
    email: string;
    city: string | null;
    totalPasses: number;
    totalSpent: number;
  };
  categoriesUsed: UserCategory[];
  bookingHistory: UserBooking[];
}

export interface EscrowOverview {
  totalHeld: number;
  totalReleased: number;
  totalBlocked: number; // PAUSED status
}

export interface EscrowBooking {
  userName: string;
  userEmail: string;
  facilityName: string;
  category: string;
  passDays: number;
  startDate: Date;
  endDate: Date;
  amount: number; // amountHeld
}

export interface EscrowOwner {
  ownerId: string;
  ownerName: string;
  amountReleased: number;
  bookings: EscrowBooking[];
}

export interface EscrowTransactionDay {
  date: string; // YYYY-MM-DD
  owners: EscrowOwner[];
}

export interface EscrowTransactionsResponse {
  transactions: EscrowTransactionDay[];
}

export interface PlatformEarnings {
  totalPlatformEarning: number;
  monthlyEarning: Array<{
    month: string; // YYYY-MM
    amount: number;
  }>;
  yearlyEarning: Array<{
    year: string; // YYYY
    amount: number;
  }>;
  monthlyAverage: number;
  totalTransactions: number;
  revenueByCategory: Array<{
    category: string;
    platformFeeRevenue: number;
  }>;
}

