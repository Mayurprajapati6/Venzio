/**
 * @file adminDashboard.controller.ts
 * HTTP handlers for Admin Dashboard module
 */

import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AdminDashboardService } from "./adminDashboard.service";
import { StatusCodes } from "http-status-codes";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../utils/errors/app.error";

export class AdminDashboardController {
  /**
   * Get dashboard overview
   * GET /admin/dashboard/overview
   */
  static async getOverview(req: AuthRequest, res: Response) {
    try {
      const data = await AdminDashboardService.getOverview();
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get dashboard overview",
      });
    }
  }

  /**
   * Get monthly revenue
   * GET /admin/dashboard/revenue/monthly?year=2024
   */
  static async getMonthlyRevenue(req: AuthRequest, res: Response) {
    try {
      const year = req.query.year as string || new Date().getFullYear().toString();
      const data = await AdminDashboardService.getMonthlyRevenue(year);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get monthly revenue",
      });
    }
  }

  /**
   * Get revenue by category
   * GET /admin/dashboard/revenue/by-category
   */
  static async getRevenueByCategory(req: AuthRequest, res: Response) {
    try {
      const data = await AdminDashboardService.getRevenueByCategory();
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get revenue by category",
      });
    }
  }

  /**
   * Get owners list
   * GET /admin/owners?search=&category=&page=&limit=
   */
  static async getOwnersList(req: AuthRequest, res: Response) {
    try {
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const data = await AdminDashboardService.getOwnersList(
        search,
        category,
        page,
        limit
      );
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get owners list",
      });
    }
  }

  /**
   * Get owner details
   * GET /admin/owners/:ownerId
   */
  static async getOwnerDetails(req: AuthRequest, res: Response) {
    try {
      const { ownerId } = req.params;
      if (!ownerId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Owner ID is required",
        });
      }

      const data = await AdminDashboardService.getOwnerDetails(ownerId);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : StatusCodes.INTERNAL_SERVER_ERROR;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to get owner details",
      });
    }
  }

  /**
   * Get users list
   * GET /admin/users?search=&page=&limit=
   */
  static async getUsersList(req: AuthRequest, res: Response) {
    try {
      const search = req.query.search as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const data = await AdminDashboardService.getUsersList(search, page, limit);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get users list",
      });
    }
  }

  /**
   * Get user details
   * GET /admin/users/:userId
   */
  static async getUserDetails(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "User ID is required",
        });
      }

      const data = await AdminDashboardService.getUserDetails(userId);
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : StatusCodes.INTERNAL_SERVER_ERROR;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to get user details",
      });
    }
  }

  /**
   * Get escrow overview
   * GET /admin/escrow/overview
   */
  static async getEscrowOverview(req: AuthRequest, res: Response) {
    try {
      const data = await AdminDashboardService.getEscrowOverview();
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get escrow overview",
      });
    }
  }

  /**
   * Get escrow transactions
   * GET /admin/escrow/transactions?from=&to=
   */
  static async getEscrowTransactions(req: AuthRequest, res: Response) {
    try {
      const fromDate = req.query.from as string | undefined;
      const toDate = req.query.to as string | undefined;

      const data = await AdminDashboardService.getEscrowTransactions(
        fromDate,
        toDate
      );
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get escrow transactions",
      });
    }
  }

  /**
   * Get platform earnings
   * GET /admin/platform/earnings
   */
  static async getPlatformEarnings(req: AuthRequest, res: Response) {
    try {
      const data = await AdminDashboardService.getPlatformEarnings();
      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get platform earnings",
      });
    }
  }

  /**
   * Block escrow (admin override)
   * POST /admin/escrow/:escrowId/block
   */
  static async blockEscrow(req: AuthRequest, res: Response) {
    try {
      const { escrowId } = req.params;
      const adminId = req.user!.userId;
      const { reason } = req.body;

      if (!escrowId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Escrow ID is required",
        });
      }

      const result = await AdminDashboardService.blockEscrow(
        escrowId,
        adminId,
        reason
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : err instanceof ConflictError
          ? StatusCodes.CONFLICT
          : StatusCodes.INTERNAL_SERVER_ERROR;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to block escrow",
      });
    }
  }

  /**
   * Release escrow (admin override)
   * POST /admin/escrow/:escrowId/release
   */
  static async releaseEscrow(req: AuthRequest, res: Response) {
    try {
      const { escrowId } = req.params;
      const adminId = req.user!.userId;

      if (!escrowId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Escrow ID is required",
        });
      }

      const result = await AdminDashboardService.releaseEscrow(
        escrowId,
        adminId
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : err instanceof ConflictError
          ? StatusCodes.CONFLICT
          : err instanceof BadRequestError
          ? StatusCodes.BAD_REQUEST
          : StatusCodes.INTERNAL_SERVER_ERROR;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to release escrow",
      });
    }
  }

  static async blockUser(req: AuthRequest, res: Response) {
    await AdminDashboardService.blockUser(req.params.userId);
    res.json({ success: true });
  }

  static async blockOwner(req: AuthRequest, res: Response) {
    await AdminDashboardService.blockOwner(req.params.ownerId);
    res.json({ success: true });
  }
}

