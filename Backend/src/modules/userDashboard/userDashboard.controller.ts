import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { UserDashboardService } from "./userDashboard.service";
import { StatusCodes } from "http-status-codes";

export class UserDashboardController {
  
  static async getPasses(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = await UserDashboardService.getPasses(userId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get passes",
      });
    }
  }

  static async getSpending(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = await UserDashboardService.getSpending(userId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get spending analytics",
      });
    }
  }

  static async getStreaks(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = await UserDashboardService.getStreaks(userId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get streaks",
      });
    }
  }

  static async getCategories(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = await UserDashboardService.getCategories(userId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get category insights",
      });
    }
  }

  static async getPendingReviews(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = await UserDashboardService.getPendingReviews(userId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || "Failed to get pending reviews",
      });
    }
  }


  static async getMyReviews(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = await UserDashboardService.getMyReviews(userId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || "Failed to get my reviews",
      });
    }
  }
}

