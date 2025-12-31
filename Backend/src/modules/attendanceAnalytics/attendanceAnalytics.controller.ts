import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AttendanceAnalyticsService } from "./attendanceAnalytics.service";
import { StatusCodes } from "http-status-codes";
import { NotFoundError, BadRequestError } from "../../utils/errors/app.error";

export class AttendanceAnalyticsController {
 
  static async getCalendar(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const month = parseInt(req.query.month as string);
      const year = parseInt(req.query.year as string);

      if (!month || !year) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Month and year are required",
        });
      }

      const data = await AttendanceAnalyticsService.getCalendar(
        userId,
        month,
        year
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err instanceof BadRequestError
          ? StatusCodes.BAD_REQUEST
          : StatusCodes.INTERNAL_SERVER_ERROR;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to get attendance calendar",
      });
    }
  }

  static async getStreaks(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = await AttendanceAnalyticsService.getStreaks(userId);

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

  static async getMonthlyAttendance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const year = req.query.year as string || new Date().getFullYear().toString();

      const data = await AttendanceAnalyticsService.getMonthlyAttendance(
        userId,
        year
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err instanceof BadRequestError
          ? StatusCodes.BAD_REQUEST
          : StatusCodes.INTERNAL_SERVER_ERROR;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to get monthly attendance",
      });
    }
  }

  static async getYearlyAttendance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = await AttendanceAnalyticsService.getYearlyAttendance(userId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get yearly attendance",
      });
    }
  }

  static async getAttendanceDetail(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { date } = req.params;

      if (!date) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Date is required",
        });
      }

      const data = await AttendanceAnalyticsService.getAttendanceDetail(
        userId,
        date
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : err instanceof BadRequestError
          ? StatusCodes.BAD_REQUEST
          : StatusCodes.INTERNAL_SERVER_ERROR;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to get attendance detail",
      });
    }
  }
}

