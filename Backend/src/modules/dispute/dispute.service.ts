/**
 * @file dispute.service.ts
 * Business logic for Dispute module
 */

import { db } from "../../db";
import { DisputeRepository } from "./dispute.repository";
import { EscrowService } from "../escrow/escrow.service";
import { EscrowRepository } from "../escrow/escrow.repository";
import { isWithinRange } from "../../utils/geo";
import { bookings} from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../utils/errors/app.error";
import type {
  DisputeCreateInput,
  DisputeResolveInput,
} from "./dispute.types";

const FALSE_DISPUTE_THRESHOLD = 3; // After 3 false disputes, monitor account
const TRUST_SCORE_DECREASE_ON_FALSE_DISPUTE = -10;
const TRUST_SCORE_INCREASE_ON_VALID_DISPUTE = 5;

export class DisputeService {
  /**
   * Create a dispute (user raises)
   */
  static async create(input: DisputeCreateInput) {
    return db.transaction(async (tx) => {
      // Get booking with lock
      const booking = await DisputeRepository.getBookingForDispute(
        tx,
        input.bookingId
      );
      if (!booking) {
        throw new NotFoundError("Booking not found");
      }

      // Validate booking ownership
      if (booking.user_id !== input.userId) {
        throw new ForbiddenError("User does not own this booking");
      }

      // Get facility to extract ownerId
      const facility = await DisputeRepository.getFacilityCoordinates(
        tx,
        booking.facility_id
      );
      if (!facility) {
        throw new NotFoundError("Facility not found");
      }

      // Use facility ownerId from database (raw SQL returns snake_case)
      const actualOwnerId = facility.owner_id;
      const actualFacilityId = booking.facility_id;

      // Validate booking status
      if (!["ACTIVE", "ACCEPTED"].includes(booking.status)) {
        throw new BadRequestError(
          `Dispute can only be raised for ACTIVE or ACCEPTED bookings. Current: ${booking.status}`
        );
      }

      // Check if dispute already exists
      const existing = await DisputeRepository.hasActiveDispute(
        tx,
        input.bookingId
      );
      if (existing) {
        throw new ConflictError("Active dispute already exists for this booking");
      }

      // Validate slot time with buffer (allow 5-15 min buffer after slot ends)
      const now = new Date();
      const slotTemplate = await DisputeRepository.getSlotTemplate(
        tx,
        actualFacilityId,
        booking.slot_type
      );

      if (slotTemplate) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;

        // Parse slot times (format: "HH:MM")
        const [startHour, startMin] = slotTemplate.start_time.split(":").map(Number);
        const [endHour, endMin] = slotTemplate.end_time.split(":").map(Number);
        const startTimeMinutes = startHour * 60 + startMin;
        const endTimeMinutes = endHour * 60 + endMin;

        // Buffer: Allow 15 minutes after slot ends for dispute raising
        const DISPUTE_BUFFER_MINUTES = 15;
        const endTimeWithBuffer = endTimeMinutes + DISPUTE_BUFFER_MINUTES;

        // Check if current time is within slot time or buffer period
        if (
          currentTimeMinutes < startTimeMinutes ||
          currentTimeMinutes > endTimeWithBuffer
        ) {
          throw new BadRequestError(
            `Dispute can only be raised during slot time or within ${DISPUTE_BUFFER_MINUTES} minutes after slot ends`
          );
        }
      }

      // Check attendance - if already marked, reject dispute
      const hasAttendance = await DisputeRepository.hasAttendance(
        tx,
        input.bookingId
      );
      if (hasAttendance) {
        throw new BadRequestError(
          "Cannot raise dispute after attendance is marked"
        );
      }

      // Geo-fence validation (if GPS provided)
      let geoValidation = null;
      if (
        input.userGpsLat !== undefined &&
        input.userGpsLng !== undefined &&
        facility.latitude !== null &&
        facility.longitude !== null
      ) {
        const facilityLat = parseFloat(String(facility.latitude));
        const facilityLng = parseFloat(String(facility.longitude));
        if (!isNaN(facilityLat) && !isNaN(facilityLng)) {
          geoValidation = isWithinRange(
            input.userGpsLat,
            input.userGpsLng,
            facilityLat,
            facilityLng,
            0.5 // 500m radius
          );
        }
      }

      // Create dispute with actual ownerId and facilityId
      const disputeId = await DisputeRepository.create(tx, {
        ...input,
        ownerId: actualOwnerId,
        facilityId: actualFacilityId,
      });

      // Update booking status to DISPUTED
      await tx
        .update(bookings)
        .set({ status: "DISPUTED" })
        .where(eq(bookings.id, input.bookingId));

      // Block escrow
      const escrow = await EscrowRepository.findByBookingId(input.bookingId);
      if (escrow && escrow.status === "HELD") {
        await EscrowRepository.updateStatus(tx, escrow.id, "PAUSED", null);
      }

      return {
        disputeId,
        bookingId: input.bookingId,
        status: "SUBMITTED",
        geoValidation: geoValidation
          ? {
              isWithinRange: geoValidation.isWithinRange,
              distanceKm: geoValidation.distanceKm,
            }
          : null,
      };
    });
  }

  /**
   * Resolve dispute (admin action)
   */
  static async resolve(input: DisputeResolveInput) {
    return db.transaction(async (tx) => {
      const dispute = await DisputeRepository.findByIdLocked(
        tx,
        input.disputeId
      );
      if (!dispute) {
        throw new NotFoundError("Dispute not found");
      }

      if (!["SUBMITTED", "UNDER_REVIEW"].includes(dispute.status)) {
        throw new ConflictError(
          `Dispute cannot be resolved. Current status: ${dispute.status}`
        );
      }

      const newStatus =
        input.decision === "REFUND"
          ? "RESOLVED_REFUND"
          : "RESOLVED_REJECTED";

      // Get escrow
      const escrow = await EscrowRepository.findByBookingId(
        dispute.bookingId
      );

      if (input.decision === "REFUND") {
        // Resolve in user's favor
        await DisputeRepository.updateStatus(
          tx,
          input.disputeId,
          newStatus,
          input.adminDecision,
          escrow ? escrow.amountHeld : undefined
        );

        // Update booking status
        await tx
          .update(bookings)
          .set({ status: "CANCELLED" })
          .where(eq(bookings.id, dispute.bookingId));

        // Trigger escrow refund
        if (escrow) {
          await EscrowService.refund({
            escrowId: escrow.id,
            adminId: input.adminId,
            reason: `Dispute resolved in user favor: ${input.adminDecision}`,
          });
        }

        // Increase user trust score
        await DisputeRepository.updateUserTrustScore(
          tx,
          dispute.userId,
          TRUST_SCORE_INCREASE_ON_VALID_DISPUTE
        );
      } else {
        // Resolve in owner's favor
        await DisputeRepository.updateStatus(
          tx,
          input.disputeId,
          newStatus,
          input.adminDecision,
          undefined 
        );

        // Update booking status back to ACTIVE (if it was ACTIVE before)
        const booking = await DisputeRepository.getBookingForDispute(
          tx,
          dispute.bookingId
        );
        if (booking && booking.status === "DISPUTED") {
          // Check if booking is still within valid period
          const endDate = new Date(booking.end_date);
          const now = new Date();
          if (now <= endDate) {
            await tx
              .update(bookings)
              .set({ status: "ACTIVE" })
              .where(eq(bookings.id, dispute.bookingId));
          } else {
            await tx
              .update(bookings)
              .set({ status: "COMPLETED" })
              .where(eq(bookings.id, dispute.bookingId));
          }
        }

        // Unblock escrow (set back to HELD if it was PAUSED)
        if (escrow && escrow.status === "PAUSED") {
          await EscrowRepository.updateStatus(tx, escrow.id, "HELD", null);
        }

        // Decrease user trust score
        await DisputeRepository.updateUserTrustScore(
          tx,
          dispute.userId,
          TRUST_SCORE_DECREASE_ON_FALSE_DISPUTE
        );

        // Check for abuse threshold
        const falseDisputeCount =
          await DisputeRepository.countFalseDisputesByUser(dispute.userId);
        if (falseDisputeCount >= FALSE_DISPUTE_THRESHOLD) {
          // Get current account status
          const userRows = await tx.execute(sql`
            SELECT account_status FROM users WHERE id = ${dispute.userId}
          `) as any[];
          const user = userRows[0];
          if (user && user.account_status === "ACTIVE") {
            await DisputeRepository.updateUserAccountStatus(
              tx,
              dispute.userId,
              "UNDER_MONITORING"
            );
          }
        }
      }

      return {
        disputeId: input.disputeId,
        status: newStatus,
        decision: input.decision,
      };
    });
  }

  /**
   * Get dispute by ID
   */
  static async getById(disputeId: string) {
    const dispute = await DisputeRepository.findById(disputeId);
    if (!dispute) {
      throw new NotFoundError("Dispute not found");
    }
    return dispute;
  }

  /**
   * Get disputes by booking ID
   */
  static async getByBookingId(bookingId: string) {
    const dispute = await DisputeRepository.findByBookingId(bookingId);
    return dispute;
  }

  /**
   * Get all disputes (admin)
   */
  static async getAllDisputes(status?: "SUBMITTED" | "UNDER_REVIEW" | "RESOLVED_REFUND" | "RESOLVED_REJECTED") {
    return await DisputeRepository.getAllDisputes(status);
  }

  /**
   * Get disputes by user
   */
  static async getDisputesByUser(userId: string) {
    return await DisputeRepository.getDisputesByUser(userId);
  }

  /**
   * Get disputes by owner
   */
  static async getDisputesByOwner(ownerId: string) {
    return await DisputeRepository.getDisputesByOwner(ownerId);
  }
}

