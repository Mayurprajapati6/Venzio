/**
 * @file adminDashboard.service.ts
 * Business logic for Admin Dashboard module
 */

import { AdminDashboardRepository } from "./adminDashboard.repository";
import { EscrowService } from "../escrow/escrow.service";
import type {
  DashboardOverview,
  MonthlyRevenueResponse,
  CategoryRevenue,
  OwnerListResponse,
  OwnerDetailsResponse,
  UserListResponse,
  UserDetailsResponse,
  EscrowOverview,
  EscrowTransactionsResponse,
  PlatformEarnings,
} from "./adminDashboard.types";
import { NotFoundError } from "../../utils/errors/app.error";

export class AdminDashboardService {
  /**
   * Get dashboard overview
   */
  static async getOverview(): Promise<DashboardOverview> {
    return await AdminDashboardRepository.getOverview();
  }

  /**
   * Get monthly revenue breakdown
   */
  static async getMonthlyRevenue(
    year: string
  ): Promise<MonthlyRevenueResponse> {
    return await AdminDashboardRepository.getMonthlyRevenue(year);
  }

  /**
   * Get revenue by category
   */
  static async getRevenueByCategory(): Promise<CategoryRevenue[]> {
    return await AdminDashboardRepository.getRevenueByCategory();
  }

  /**
   * Get owners list
   */
  static async getOwnersList(
    search?: string,
    category?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<OwnerListResponse> {
    return await AdminDashboardRepository.getOwnersList(
      search,
      category,
      page,
      limit
    );
  }

  /**
   * Get owner details
   */
  static async getOwnerDetails(
    ownerId: string
  ): Promise<OwnerDetailsResponse> {
    const details = await AdminDashboardRepository.getOwnerDetails(ownerId);
    if (!details) {
      throw new NotFoundError("Owner not found");
    }
    return details;
  }

  /**
   * Get users list
   */
  static async getUsersList(
    search?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<UserListResponse> {
    return await AdminDashboardRepository.getUsersList(search, page, limit);
  }

  /**
   * Get user details
   */
  static async getUserDetails(userId: string): Promise<UserDetailsResponse> {
    const details = await AdminDashboardRepository.getUserDetails(userId);
    if (!details) {
      throw new NotFoundError("User not found");
    }
    return details;
  }

  /**
   * Get escrow overview
   */
  static async getEscrowOverview(): Promise<EscrowOverview> {
    return await AdminDashboardRepository.getEscrowOverview();
  }

  /**
   * Get escrow transactions
   */
  static async getEscrowTransactions(
    fromDate?: string,
    toDate?: string
  ): Promise<EscrowTransactionsResponse> {
    return await AdminDashboardRepository.getEscrowTransactions(
      fromDate,
      toDate
    );
  }

  /**
   * Get platform earnings
   */
  static async getPlatformEarnings(): Promise<PlatformEarnings> {
    return await AdminDashboardRepository.getPlatformEarnings();
  }

  /**
   * Block escrow (admin override)
   */
  static async blockEscrow(escrowId: string, adminId: string, reason?: string) {
    return await EscrowService.block({
      escrowId,
      adminId,
      reason,
    });
  }

  /**
   * Release escrow (admin override)
   */
  static async releaseEscrow(escrowId: string, adminId: string) {
    return await EscrowService.release({
      escrowId,
      adminId,
    });
  }

  static async blockUser(userId: string) {
    return AdminDashboardRepository.blockUser(userId);
  }

  static async blockOwner(ownerId: string) {
    return AdminDashboardRepository.blockOwner(ownerId);
  }
}

