/**
 * @file ownerDashboard.controller.ts
 * HTTP handlers for Owner Dashboard module
 */

import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { OwnerDashboardService } from "./ownerDashboard.service";
import { StatusCodes } from "http-status-codes";

export class OwnerDashboardController {
  /**
   * Get revenue analytics
   * GET /api/owner/dashboard/revenue
   */
  static async getRevenue(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.userId;
      const data = await OwnerDashboardService.getRevenue(ownerId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get revenue analytics",
      });
    }
  }

  /**
   * Get payout history
   * GET /api/owner/dashboard/payouts
   */
  static async getPayouts(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.userId;
      const data = await OwnerDashboardService.getPayouts(ownerId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get payouts",
      });
    }
  }

  /**
   * Get recent check-ins
   * GET /api/owner/dashboard/checkins
   */
  static async getCheckIns(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.userId;
      const data = await OwnerDashboardService.getCheckIns(ownerId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get check-ins",
      });
    }
  }

  /**
   * Get facility users view
   * GET /api/owner/dashboard/facilities/users
   */
  static async getFacilityUsers(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.userId;
      const data = await OwnerDashboardService.getFacilityUsers(ownerId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get facility users",
      });
    }
  }

  static async getFacilityReviews(req: AuthRequest, res: Response) {
    const ownerId = req.user!.userId;
    const { facilityId } = req.params;

    const data = await OwnerDashboardService.getFacilityReviews(
      ownerId,
      facilityId
    );

    return res.status(StatusCodes.OK).json({ success: true, data });
  }

  /**
   * Get quick counts/summary
   * GET /api/owner/dashboard/summary
   */
  static async getQuickCounts(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.userId;
      const data = await OwnerDashboardService.getQuickCounts(ownerId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get summary",
      });
    }
  }
}

