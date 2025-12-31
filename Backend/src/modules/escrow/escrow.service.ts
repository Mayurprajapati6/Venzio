/**
 * @file escrow.service.ts
 * Business logic for Escrow module
 */

import { db } from "../../db";
import { EscrowRepository } from "./escrow.repository";
import { PaymentService } from "../payment/payment.service";
import { bookings } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
} from "../../utils/errors/app.error";
import type {
  EscrowCreateInput,
  EscrowReleaseInput,
  EscrowRefundInput,
  EscrowBlockInput,
} from "./escrow.types";
import { groupEscrowsByFacility } from "./escrow.aggregation";

export class EscrowService {
  /**
   * Create escrow after payment success webhook
   * Called by payment webhook handler
   */
  static async createAfterPayment(data: EscrowCreateInput) {
    return db.transaction(async (tx) => {
      // Check if escrow already exists (idempotency)
      const existing = await EscrowRepository.existsForBooking(
        tx,
        data.bookingId
      );
      if (existing) {
        throw new ConflictError("Escrow already exists for this booking");
      }

      // Verify booking exists and is ACTIVE
      const bookingRows = await tx.execute(sql`
        SELECT * FROM bookings WHERE id = ${data.bookingId} FOR UPDATE
      `) as any[];
      const booking = bookingRows[0];
      if (!booking) {
        throw new NotFoundError("Booking not found");
      }
      if (booking.status !== "ACTIVE") {
        throw new BadRequestError(
          `Escrow can only be created for ACTIVE bookings. Current: ${booking.status}`
        );
      }

      // Create escrow
      const escrowId = await EscrowRepository.create(tx, data);

      return {
        escrowId,
        bookingId: data.bookingId,
        status: "HELD",
      };
    });
  }

  /**
   * Release escrow to owner (deduct platform fee)
   * Auto-release or admin force release
   */
  static async release(input: EscrowReleaseInput) {
    return db.transaction(async (tx) => {
      const escrow = await EscrowRepository.findByIdLocked(tx, input.escrowId);
      if (!escrow) {
        throw new NotFoundError("Escrow not found");
      }

      if (escrow.status !== "HELD") {
        throw new ConflictError(
          `Escrow cannot be released. Current status: ${escrow.status}`
        );
      }

      // Check for active dispute
      const hasDispute = await EscrowRepository.hasActiveDispute(
        tx,
        escrow.bookingId
      );
      if (hasDispute) {
        throw new ForbiddenError(
          "Cannot release escrow while dispute is active"
        );
      }

      // Verify booking is not DISPUTED
      const bookingRows = await tx.execute(sql`
        SELECT status FROM bookings WHERE id = ${escrow.bookingId}
      `) as any[];
      const booking = bookingRows[0];
      if (booking && booking.status === "DISPUTED") {
        throw new ForbiddenError("Cannot release escrow for DISPUTED booking");
      }

      // Update escrow status
      await EscrowRepository.updateStatus(tx, input.escrowId, "RELEASED", new Date());

      // NOTE: Actual payout to owner happens via separate payout service/webhook
      // This escrow module only tracks the status change

      return {
        escrowId: input.escrowId,
        status: "RELEASED",
        payoutAmount: escrow.amountHeld - escrow.platformFee,
        platformFee: escrow.platformFee,
      };
    });
  }

  /**
   * Refund escrow to user
   * Called on cancellation (before startDate) or dispute resolution
   */
  static async refund(input: EscrowRefundInput) {
    return db.transaction(async (tx) => {
      const escrow = await EscrowRepository.findByIdLocked(tx, input.escrowId);
      if (!escrow) {
        throw new NotFoundError("Escrow not found");
      }

      if (escrow.status === "REFUNDED") {
        // Idempotency: already refunded
        return {
          escrowId: input.escrowId,
          status: "REFUNDED",
          message: "Already refunded",
        };
      }

      if (escrow.status !== "HELD" && escrow.status !== "PAUSED") {
        throw new ConflictError(
          `Escrow cannot be refunded. Current status: ${escrow.status}`
        );
      }

      // Get booking to find payment
      const bookingRows = await tx.execute(sql`
        SELECT * FROM bookings WHERE id = ${escrow.bookingId}
      `) as any[];
      const booking = bookingRows[0];
      if (!booking) {
        throw new NotFoundError("Booking not found");
      }

      // Get payment record
      const payment = await PaymentService.getPaymentByBookingId(
        escrow.bookingId
      );
      if (!payment) {
        throw new NotFoundError("Payment not found for booking");
      }

      if (!payment.razorpayPaymentId) {
        throw new BadRequestError("Razorpay payment ID not found");
      }

      // Update escrow status first (optimistic)
      await EscrowRepository.updateStatus(tx, input.escrowId, "REFUNDED", null);

      // Execute refund via payment service
      try {
        await PaymentService.refund(
          payment.razorpayPaymentId,
          escrow.amountHeld, // Full amount refunded
          input.reason || "Escrow refund"
        );
      } catch (error: any) {
        // Rollback escrow status on refund failure
        await EscrowRepository.updateStatus(tx, input.escrowId, escrow.status, null);
        throw new InternalServerError(
          `Refund execution failed: ${error.message}`
        );
      }

      return {
        escrowId: input.escrowId,
        status: "REFUNDED",
        refundAmount: escrow.amountHeld,
      };
    });
  }

  /**
   * Block escrow (admin action)
   * Sets status to PAUSED to prevent release
   */
  static async block(input: EscrowBlockInput) {
    return db.transaction(async (tx) => {
      const escrow = await EscrowRepository.findByIdLocked(tx, input.escrowId);
      if (!escrow) {
        throw new NotFoundError("Escrow not found");
      }

      if (escrow.status === "RELEASED" || escrow.status === "REFUNDED") {
        throw new ConflictError(
          `Cannot block escrow. Current status: ${escrow.status}`
        );
      }

      await EscrowRepository.updateStatus(tx, input.escrowId, "PAUSED", null);

      // Update booking status to DISPUTED if not already
      await tx
        .update(bookings)
        .set({ status: "DISPUTED" })
        .where(eq(bookings.id, escrow.bookingId));

      return {
        escrowId: input.escrowId,
        status: "PAUSED",
      };
    });
  }

  /**
   * Handle booking cancellation - check if refund needed
   * Called by booking cancellation logic
   */
  static async handleBookingCancellation(bookingId: string) {
    return db.transaction(async (tx) => {
      const escrow = await EscrowRepository.findByBookingIdLocked(
        tx,
        bookingId
      );
      if (!escrow) {
        // No escrow exists (payment not completed yet)
        return { action: "NO_ESCROW" };
      }

      if (escrow.status !== "HELD") {
        // Already processed
        return { action: "ALREADY_PROCESSED", status: escrow.status };
      }

      // Get booking to check startDate
      const bookingRows = await tx.execute(sql`
        SELECT start_date FROM bookings WHERE id = ${bookingId}
      `) as any[];
      const booking = bookingRows[0];
      if (!booking) {
        throw new NotFoundError("Booking not found");
      }

      const startDate = new Date(booking.start_date);
      const now = new Date();

      // If cancelled before startDate, trigger full refund
      if (now < startDate) {
        await EscrowRepository.updateStatus(tx, escrow.id, "REFUNDED", null);

        // Get payment and execute refund
        const payment = await PaymentService.getPaymentByBookingId(bookingId);
        if (payment && payment.razorpayPaymentId) {
          try {
            await PaymentService.refund(
              payment.razorpayPaymentId,
              escrow.amountHeld,
              "Booking cancelled before start date"
            );
          } catch (error: any) {
            // Rollback on failure
            await EscrowRepository.updateStatus(tx, escrow.id, "HELD", null);
            throw new InternalServerError(
              `Refund execution failed: ${error.message}`
            );
          }
        }

        return {
          action: "REFUNDED",
          escrowId: escrow.id,
          refundAmount: escrow.amountHeld,
        };
      }

      // Cancelled after startDate - no auto refund
      return { action: "NO_AUTO_REFUND", reason: "Cancelled after start date" };
    });
  }

  /**
   * Auto-release escrows (called by cron)
   */
  static async autoReleaseReadyEscrows() {
    const readyEscrows = await EscrowRepository.findReadyForRelease();
    const results = [];

    for (const escrow of readyEscrows) {
      try {
        const result = await this.release({ escrowId: escrow.id });
        results.push({ success: true, ...result });
      } catch (error: any) {
        results.push({
          success: false,
          escrowId: escrow.id,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get escrow by booking ID
   */
  static async getByBookingId(bookingId: string) {
    const escrow = await EscrowRepository.findByBookingId(bookingId);
    if (!escrow) {
      throw new NotFoundError("Escrow not found for booking");
    }
    return escrow;
  }

  static async getAdminEscrowDashboard() {
  const [today, upcoming, expired] = await Promise.all([
    EscrowRepository.getTodayEscrows(),
    EscrowRepository.getUpcomingEscrows(),
    EscrowRepository.getExpiredEscrows(),
  ]);

  return {
    today: groupEscrowsByFacility(today as any[]),
    upcoming: groupEscrowsByFacility(upcoming as any[]),
    expired: groupEscrowsByFacility(expired as any[]),
  };
}

  static async getOwnerEscrowDashboard(ownerId: string) {
  const [today, upcoming, expired] = await Promise.all([
    EscrowRepository.getTodayEscrows(),
    EscrowRepository.getUpcomingEscrows(),
    EscrowRepository.getExpiredEscrows(),
  ]);

  const filter = (rows: any[]) =>
    rows.filter((r) => r.owner_id === ownerId);

  return {
    today: groupEscrowsByFacility(filter(today as any[])),
    upcoming: groupEscrowsByFacility(filter(upcoming as any[])),
    expired: groupEscrowsByFacility(filter(expired as any[])),
  };
}

  
}

