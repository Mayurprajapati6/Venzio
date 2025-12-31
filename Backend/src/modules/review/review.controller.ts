import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { ReviewService } from "./review.service";
import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../utils/errors/app.error";

export class ReviewController {
  /**
   * Create a review
   * POST /reviews
   */
  static async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { bookingId, rating, comment } = req.body;

      if (!bookingId || rating === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "bookingId and rating are required",
        });
      }

      const result = await ReviewService.create({
        bookingId,
        userId,
        rating,
        comment,
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
        message: error.message || "Failed to create review",
      });
    }
  }

  /**
   * Get reviews for a facility (public)
   * GET /reviews/facility/:facilityId
   */
  static async getByFacilityId(req: AuthRequest, res: Response) {
    try {
      const { facilityId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!facilityId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Facility ID is required",
        });
      }

      const result = await ReviewService.getByFacilityId(
        facilityId,
        page,
        limit
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get reviews",
      });
    }
  }

  /**
   * Get all reviews (admin only)
   * GET /reviews/admin
   */
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await ReviewService.getAll(page, limit);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get reviews",
      });
    }
  }

  /**
   * Get review by ID
   * GET /reviews/:reviewId
   */
  static async getById(req: AuthRequest, res: Response) {
    try {
      const { reviewId } = req.params;
      const review = await ReviewService.getById(reviewId);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: review,
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
        message: error.message || "Failed to get review",
      });
    }
  }

  /**
   * Get review by booking ID
   * GET /reviews/booking/:bookingId
   */
  static async getByBookingId(req: AuthRequest, res: Response) {
    try {
      const { bookingId } = req.params;
      const review = await ReviewService.getByBookingId(bookingId);

      if (!review) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Review not found for this booking",
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        data: review,
      });
    } catch (err: any) {
      const error = err as Error;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to get review",
      });
    }
  }
}

