/**
 * @file attendance.service.ts
 * Business logic for Attendance module
 */

import { db } from "../../db";
import { AttendanceRepository } from "./attendance.repository";
import { parseQR, type QRPayload } from "../../utils/helpers/qr";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/errors/app.error";
import { FacilityRepository } from "../facility/facility.repository";
import logger from "../../config/logger.config";
import { bookings } from "../../db/schema";
import { eq } from "drizzle-orm";

export class AttendanceService {
  /**
   * Scan QR code (PREVIEW ONLY - does NOT mark attendance)
   * Validates QR and returns booking details for owner confirmation
   */
  static async scanQR(ownerId: string, qrCode: string) {
    let qrPayload: QRPayload;
    try {
      qrPayload = parseQR(qrCode);
    } catch (error: any) {
      logger.warn(`QR scan failed - Invalid QR: ${error.message}`, {
        ownerId,
        error: error.message,
      });
      throw new BadRequestError(`Invalid QR code: ${error.message}`);
    }

    // Fetch booking with details (no transaction needed for preview)
    const bookingDetails = await AttendanceRepository.getBookingWithDetails(
      qrPayload.bookingId
    );

    if (!bookingDetails) {
      logger.warn(`QR scan failed - Booking not found`, {
        ownerId,
        bookingId: qrPayload.bookingId,
      });
      throw new NotFoundError("Booking not found");
    }

    // Get booking for status check
    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, qrPayload.bookingId))
      .limit(1);

    if (booking.length === 0) {
      throw new NotFoundError("Booking not found");
    }

    const bookingData = booking[0];

    if (!booking) {
      logger.warn(`QR scan failed - Booking not found`, {
        ownerId,
        bookingId: qrPayload.bookingId,
      });
      throw new NotFoundError("Booking not found");
    }

    // Validate booking status
    if (bookingData.status !== "ACTIVE" && bookingData.status !== "ACCEPTED") {
      logger.warn(`QR scan failed - Invalid booking status`, {
        ownerId,
        bookingId: qrPayload.bookingId,
        status: bookingData.status,
      });
      throw new BadRequestError(
        `Booking is not active. Current status: ${bookingData.status}`
      );
    }

    // Validate facility ownership
    const facility = await FacilityRepository.getById(bookingData.facilityId);
    if (!facility) {
      throw new NotFoundError("Facility not found");
    }

    if (facility.ownerId !== ownerId) {
      logger.warn(`QR scan failed - Wrong facility owner`, {
        ownerId,
        bookingFacilityId: bookingData.facilityId,
        facilityOwnerId: facility.ownerId,
      });
      throw new ForbiddenError("This facility does not belong to you");
    }

    // Validate QR facility matches booking facility
    if (qrPayload.facilityId !== bookingData.facilityId) {
      logger.warn(`QR scan failed - Facility mismatch`, {
        ownerId,
        qrFacilityId: qrPayload.facilityId,
        bookingFacilityId: bookingData.facilityId,
      });
      throw new BadRequestError("QR code is for a different facility");
    }

    // Validate date range (today must be between validFrom and validTill)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validFrom = new Date(qrPayload.validFrom);
    validFrom.setHours(0, 0, 0, 0);
    const validTill = new Date(qrPayload.validTill);
    validTill.setHours(23, 59, 59, 999);

    if (today < validFrom || today > validTill) {
      logger.warn(`QR scan failed - Outside valid date range`, {
        ownerId,
        bookingId: qrPayload.bookingId,
        today: today.toISOString(),
        validFrom: validFrom.toISOString(),
        validTill: validTill.toISOString(),
      });
      throw new BadRequestError("QR code is expired or not yet valid");
    }

    // Validate slot time window (if slot template exists)

    let slotTimeValid = true;
    let slotTimeReason = "";

    if (bookingDetails.slotStartTime && bookingDetails.slotEndTime) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      const [startHour, startMin] = bookingDetails.slotStartTime
        .split(":")
        .map(Number);
      const [endHour, endMin] = bookingDetails.slotEndTime
        .split(":")
        .map(Number);

      const slotStartTime = startHour * 60 + startMin;
      const slotEndTime = endHour * 60 + endMin;

      if (currentTime < slotStartTime || currentTime > slotEndTime) {
        slotTimeValid = false;
        slotTimeReason = `Outside slot time window (${bookingDetails.slotStartTime} - ${bookingDetails.slotEndTime})`;
        logger.warn(`QR scan - Outside slot time`, {
          ownerId,
          bookingId: qrPayload.bookingId,
          currentTime: `${currentHour}:${currentMinute}`,
          slotTime: `${bookingDetails.slotStartTime} - ${bookingDetails.slotEndTime}`,
        });
      }
    }

    // Check if attendance already marked today
    const alreadyMarked = await AttendanceRepository.checkAttendanceToday(
      qrPayload.bookingId,
      today
    );

    let canMarkAttendance = true;
    let reason = "";

    if (alreadyMarked) {
      canMarkAttendance = false;
      reason = "Attendance already marked for today";
    } else if (!slotTimeValid) {
      canMarkAttendance = false;
      reason = slotTimeReason;
    } else if (bookingData.activeDaysRemaining <= 0) {
      canMarkAttendance = false;
      reason = "Pass has expired (no active days remaining)";
    }

    return {
      userName: bookingDetails.userName,
      facilityName: bookingDetails.facilityName,
      slotType: bookingDetails.slotType,
      slotTime:
        bookingDetails.slotStartTime && bookingDetails.slotEndTime
          ? `${bookingDetails.slotStartTime} - ${bookingDetails.slotEndTime}`
          : null,
      passDays: bookingDetails.passDays,
      activeDaysRemaining: bookingDetails.activeDaysRemaining,
      startDate: bookingDetails.startDate,
      endDate: bookingDetails.endDate,
      canMarkAttendance,
      reason: canMarkAttendance ? null : reason,
    };
  }

  /**
   * Mark attendance (FINAL ACTION)
   * Requires bookingId (not QR code) for explicit confirmation
   */
  static async markAttendance(
    ownerId: string,
    bookingId: string
  ) {
    return db.transaction(async (tx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Re-fetch booking with lock
      const booking = await AttendanceRepository.getBookingForScan(
        tx,
        bookingId
      );

      if (!booking) {
        throw new NotFoundError("Booking not found");
      }

      // Re-check ownership
      const facility = await FacilityRepository.getById(booking.facilityId);
      if (!facility) {
        throw new NotFoundError("Facility not found");
      }

      if (facility.ownerId !== ownerId) {
        logger.warn(`Mark attendance failed - Wrong owner`, {
          ownerId,
          facilityOwnerId: facility.ownerId,
          bookingId,
        });
        throw new ForbiddenError("This facility does not belong to you");
      }

      // Re-check booking status
      if (booking.status !== "ACTIVE" && booking.status !== "ACCEPTED") {
        throw new BadRequestError(
          `Cannot mark attendance. Booking status: ${booking.status}`
        );
      }

      // Check holiday
      const isHoliday = await AttendanceRepository.isHoliday(
        tx,
        booking.facilityId,
        today
      );

      if (isHoliday) {
        logger.warn(`Mark attendance failed - Holiday`, {
          ownerId,
          bookingId,
          date: today.toISOString(),
        });
        throw new BadRequestError("Cannot mark attendance on a holiday");
      }

      // Ensure attendance not already marked today
      const alreadyMarked = await AttendanceRepository.alreadyMarked(
        tx,
        bookingId,
        today
      );

      if (alreadyMarked) {
        logger.warn(`Mark attendance failed - Already marked`, {
          ownerId,
          bookingId,
          date: today.toISOString(),
        });
        throw new BadRequestError("Attendance already marked for today");
      }

      // Insert attendance record
      await AttendanceRepository.insertAttendance(
        tx,
        bookingId,
        booking.facilityId,
        today
      );

      // Decrement activeDaysRemaining
      await AttendanceRepository.decrementActiveDay(tx, bookingId);

      // If activeDaysRemaining becomes 0, mark booking COMPLETED
      const newRemainingDays = booking.activeDaysRemaining - 1;
      if (newRemainingDays === 0) {
        await AttendanceRepository.completeBooking(tx, bookingId);
      }

      return {
        message: "Attendance marked successfully",
        activeDaysRemaining: newRemainingDays,
        bookingStatus: newRemainingDays === 0 ? "COMPLETED" : booking.status,
      };
    });
  }
}
