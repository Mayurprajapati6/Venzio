import { OwnerDashboardRepository } from "./ownerDashboard.repository";
import type {
  RevenueResponse,
  PayoutsResponse,
  CheckInsResponse,
  FacilityUsersResponse,
  QuickCountsResponse,
  FacilityReviewsResponse,
  FacilityBookingsResponse,
} from "./ownerDashboard.types";

export class OwnerDashboardService {
 
  static async getRevenue(ownerId: string): Promise<RevenueResponse> {
    return await OwnerDashboardRepository.getRevenueAnalytics(ownerId);
  }

  
  static async getPayouts(ownerId: string): Promise<PayoutsResponse> {
    const payouts = await OwnerDashboardRepository.getPayouts(ownerId);
    return { payouts };
  }

 
  static async getCheckIns(ownerId: string): Promise<CheckInsResponse> {
    return await OwnerDashboardRepository.getCheckIns(ownerId);
  }

  
  static async getFacilityUsers(ownerId: string): Promise<FacilityUsersResponse> {
    return {
      facilities: await OwnerDashboardRepository.getFacilityUsers(ownerId),
    };
  }

  
  static async getQuickCounts(ownerId: string): Promise<QuickCountsResponse> {
    return await OwnerDashboardRepository.getQuickCounts(ownerId);
  }

   static async getFacilityReviews(
    ownerId: string,
    facilityId: string
  ): Promise<FacilityReviewsResponse> {
    return await OwnerDashboardRepository.getFacilityReviews(ownerId, facilityId);
  }

  static async getFacilityBookings(
  ownerId: string,
  facilityId: string
): Promise<FacilityBookingsResponse> {
  const data =
    await OwnerDashboardRepository.getFacilityBookings(
      ownerId,
      facilityId
    );

  return {
    facilityId,
    facilityName: "", // already known on frontend
    currentBookings: data.currentBookings,
    pastUsers: data.pastUsers,
  };
}
}

