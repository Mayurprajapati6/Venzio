/**
 * @file dispute.controller.ts
 * HTTP handlers for Dispute module
 */

import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { DisputeService } from "./dispute.service";
import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../utils/errors/app.error";

export class DisputeController {
  /**
   * Create a dispute (USER)
   * POST /disputes
   */
  static async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        bookingId,
        reason,
        description,
        evidenceImage,
        userGpsLat,
        userGpsLng,
      } = req.body;

      if (!bookingId || !reason) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "bookingId and reason are required",
        });
      }

      // ownerId and facilityId will be fetched from booking in the service
      const result = await DisputeService.create({
        bookingId,
        userId,
        ownerId: "", // Will be fetched from facility
        facilityId: "", // Will be fetched from booking
        reason,
        description,
        evidenceImage,
        userGpsLat: userGpsLat !== undefined ? parseFloat(String(userGpsLat)) : undefined,
        userGpsLng: userGpsLng !== undefined ? parseFloat(String(userGpsLng)) : undefined,
      });

      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err.statusCode ||
        (err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : err instanceof BadRequestError
          ? StatusCodes.BAD_REQUEST
          : err instanceof ForbiddenError
          ? StatusCodes.FORBIDDEN
          : err instanceof ConflictError
          ? StatusCodes.CONFLICT
          : StatusCodes.INTERNAL_SERVER_ERROR);

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to create dispute",
      });
    }
  }

  /**
   * Resolve dispute (ADMIN)
   * PATCH /disputes/:disputeId/resolve
   */
  static async resolve(req: AuthRequest, res: Response) {
    try {
      const { disputeId } = req.params;
      const adminId = req.user!.userId;
      const { decision, adminDecision } = req.body;

      if (!disputeId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Dispute ID is required",
        });
      }

      if (!decision || !["REFUND", "REJECT"].includes(decision)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "decision must be 'REFUND' or 'REJECT'",
        });
      }

      if (!adminDecision) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "adminDecision is required",
        });
      }

      const result = await DisputeService.resolve({
        disputeId,
        adminId,
        decision: decision as "REFUND" | "REJECT",
        adminDecision,
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
          : err instanceof BadRequestError
          ? StatusCodes.BAD_REQUEST
          : err instanceof ConflictError
          ? StatusCodes.CONFLICT
          : StatusCodes.INTERNAL_SERVER_ERROR);

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to resolve dispute",
      });
    }
  }

  /**
   * Get dispute by ID
   * GET /disputes/:disputeId
   */
  static async getById(req: AuthRequest, res: Response) {
    try {
      const { disputeId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const dispute = await DisputeService.getById(disputeId);

      // Authorization check
      if (
        userRole !== "ADMIN" &&
        dispute.userId !== userId &&
        dispute.ownerId !== userId
      ) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Access denied",
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        data: dispute,
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
        message: error.message || "Failed to get dispute",
      });
    }
  }

  /**
   * Get disputes by booking ID
   * GET /disputes/booking/:bookingId
   */
  static async getByBookingId(req: AuthRequest, res: Response) {
    try {
      const { bookingId } = req.params;
      const dispute = await DisputeService.getByBookingId(bookingId);

      if (!dispute) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Dispute not found for this booking",
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        data: dispute,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get dispute",
      });
    }
  }

  /**
   * Get all disputes (ADMIN)
   * GET /disputes/admin
   */
  static async getAllDisputes(req: AuthRequest, res: Response) {
    try {
      const { status } = req.query;
      const disputes = await DisputeService.getAllDisputes(
        status as any
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: disputes,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get disputes",
      });
    }
  }

  /**
   * Get disputes by user (USER)
   * GET /disputes/my
   */
  static async getMyDisputes(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const disputes = await DisputeService.getDisputesByUser(userId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: disputes,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get disputes",
      });
    }
  }

  /**
   * Get disputes by owner (OWNER)
   * GET /disputes/owner/my
   */
  static async getOwnerDisputes(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.userId;
      const disputes = await DisputeService.getDisputesByOwner(ownerId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: disputes,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get disputes",
      });
    }
  }
}

