import { db } from "../../db";
import { ReviewRepository } from "./review.repository";
import { bookings } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from "../../utils/errors/app.error";
import { randomUUID } from "crypto";
import type { ReviewCreateInput } from "./review.types";

const MIN_RATING = 1;
const MAX_RATING = 5;

export class ReviewService {
  /**
   * Create a review
   * Enforces: booking must be COMPLETED, user owns booking, one review per booking
   */
  static async create(input: ReviewCreateInput) {
    return db.transaction(async (tx) => {
      // Validate rating range
      if (input.rating < MIN_RATING || input.rating > MAX_RATING) {
        throw new BadRequestError(
          `Rating must be between ${MIN_RATING} and ${MAX_RATING}`
        );
      }

      // Get booking with lock and verify ownership
      const booking = await ReviewRepository.getBookingForReview(
        tx,
        input.bookingId,
        input.userId
      );

      if (!booking) {
        throw new NotFoundError("Booking not found");
      }

      // Verify booking belongs to user
      if (booking.user_id !== input.userId) {
        throw new ForbiddenError("User does not own this booking");
      }

      // CRITICAL: Only allow review for COMPLETED bookings
      if (booking.status !== "COMPLETED") {
        throw new BadRequestError(
          `Review can only be created for COMPLETED bookings. Current status: ${booking.status}`
        );
      }

      // Check if review already exists (idempotency)
      const existingReview = await ReviewRepository.existsForBooking(
        tx,
        input.bookingId
      );
      if (existingReview) {
        throw new ConflictError("Review already exists for this booking");
      }

      // Get facility for rating update
      const facility = await ReviewRepository.getFacilityForRating(
        tx,
        booking.facility_id
      );
      if (!facility) {
        throw new NotFoundError("Facility not found");
      }

      // Calculate new rating
      const oldRating = parseFloat(String(facility.rating)) || 0;
      const totalReviews = facility.total_reviews || 0;
      const newTotalReviews = totalReviews + 1;
      const newRating =
        (oldRating * totalReviews + input.rating) / newTotalReviews;

      // Create review
      const reviewId = randomUUID();
      await ReviewRepository.create(tx, {
        id: reviewId,
        userId: input.userId,
        facilityId: booking.facility_id,
        bookingId: input.bookingId,
        rating: input.rating,
        comment: input.comment,
      });

      // Update facility rating and total reviews (within same transaction)
      await ReviewRepository.updateFacilityRating(
        tx,
        booking.facility_id,
        newRating,
        newTotalReviews
      );

      return {
        id: reviewId,
        bookingId: input.bookingId,
        facilityId: booking.facility_id,
        rating: input.rating,
        comment: input.comment || null,
        message: "Review created successfully",
      };
    });
  }

  /**
   * Get reviews for a facility (public, paginated)
   */
  static async getByFacilityId(
    facilityId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const offset = (page - 1) * limit;
    const reviews = await ReviewRepository.findByFacilityId(
      facilityId,
      limit,
      offset
    );
    const total = await ReviewRepository.countByFacilityId(facilityId);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all reviews (admin only)
   */
  static async getAll(page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;
    const reviews = await ReviewRepository.getAll(limit, offset);

    return {
      reviews,
      pagination: {
        page,
        limit,
      },
    };
  }

  /**
   * Get review by ID
   */
  static async getById(reviewId: string) {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found");
    }
    return review;
  }

  /**
   * Get review by booking ID
   */
  static async getByBookingId(bookingId: string) {
    const review = await ReviewRepository.findByBookingId(bookingId);
    return review;
  }
}

