/**
 * @file attendance.controller.ts
 * HTTP handlers for Attendance module
 */

import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AttendanceService } from "./attendance.service";
import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/errors/app.error";

export class AttendanceController {
  /**
   * Scan QR code (PREVIEW ONLY - does NOT mark attendance)
   * POST /attendance/scan
   */
  static async scan(req: AuthRequest, res: Response) {
    try {
      const { qrCode } = req.body;

      if (!qrCode) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "QR code is required",
        });
      }

      const result = await AttendanceService.scanQR(
        req.user!.userId,
        qrCode
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
          : err instanceof ForbiddenError
          ? StatusCodes.FORBIDDEN
          : err instanceof BadRequestError
          ? StatusCodes.BAD_REQUEST
          : StatusCodes.INTERNAL_SERVER_ERROR;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to scan QR code",
      });
    }
  }

  /**
   * Mark attendance (FINAL ACTION)
   * POST /attendance/mark
   */
  static async mark(req: AuthRequest, res: Response) {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Booking ID is required",
        });
      }

      const result = await AttendanceService.markAttendance(
        req.user!.userId,
        bookingId
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
          : err instanceof ForbiddenError
          ? StatusCodes.FORBIDDEN
          : err instanceof BadRequestError
          ? StatusCodes.BAD_REQUEST
          : StatusCodes.INTERNAL_SERVER_ERROR;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to mark attendance",
      });
    }
  }
}
