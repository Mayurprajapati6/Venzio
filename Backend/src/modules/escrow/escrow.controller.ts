/**
 * @file escrow.controller.ts
 * HTTP handlers for Escrow module (Admin only)
 */

import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { EscrowService } from "./escrow.service";
import { StatusCodes } from "http-status-codes";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../utils/errors/app.error";

export class EscrowController {
  /**
   * Get escrow by booking ID
   * GET /escrow/booking/:bookingId
   */
  static async getByBookingId(req: AuthRequest, res: Response) {
    try {
      const { bookingId } = req.params;
      const escrow = await EscrowService.getByBookingId(bookingId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: escrow,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err.statusCode ||
        (err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : StatusCodes.INTERNAL_SERVER_ERROR);

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to get escrow",
      });
    }
  }

  /**
   * Force release escrow (ADMIN)
   * PATCH /escrow/:escrowId/release
   */
  static async forceRelease(req: AuthRequest, res: Response) {
    try {
      const { escrowId } = req.params;
      const adminId = req.user!.userId;

      if (!escrowId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Escrow ID is required",
        });
      }

      const result = await EscrowService.release({
        escrowId,
        adminId,
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err.statusCode ||
        (err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : err instanceof ConflictError
          ? StatusCodes.CONFLICT
          : err instanceof ForbiddenError
          ? StatusCodes.FORBIDDEN
          : StatusCodes.INTERNAL_SERVER_ERROR);

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to release escrow",
      });
    }
  }

  /**
   * Block escrow (ADMIN)
   * PATCH /escrow/:escrowId/block
   */
  static async block(req: AuthRequest, res: Response) {
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

      const result = await EscrowService.block({
        escrowId,
        adminId,
        reason,
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err.statusCode ||
        (err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : err instanceof ConflictError
          ? StatusCodes.CONFLICT
          : StatusCodes.INTERNAL_SERVER_ERROR);

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to block escrow",
      });
    }
  }

  /**
   * Force refund escrow (ADMIN)
   * PATCH /escrow/:escrowId/refund
   */
  static async forceRefund(req: AuthRequest, res: Response) {
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

      const result = await EscrowService.refund({
        escrowId,
        adminId,
        reason,
      });

      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err.statusCode ||
        (err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : err instanceof ConflictError
          ? StatusCodes.CONFLICT
          : StatusCodes.INTERNAL_SERVER_ERROR);

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to refund escrow",
      });
    }
  }

  // ADMIN
  static async adminDashboard(req: AuthRequest, res: Response) {
    const data = await EscrowService.getAdminEscrowDashboard();
    res.status(StatusCodes.OK).json({ success: true, data });
  }

  // OWNER
  static async ownerDashboard(req: AuthRequest, res: Response) {
    const ownerId = req.user!.userId;
    const data = await EscrowService.getOwnerEscrowDashboard(ownerId);
    res.status(StatusCodes.OK).json({ success: true, data });
  }
}

