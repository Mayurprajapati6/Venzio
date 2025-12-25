import { db } from "../../db";
import { BookingCancelRepository } from "./booking.cancel.repository";
import {
  BadRequestError,
  ForbiddenError,
} from "../../utils/errors/app.error";

export class BookingCancelService {
  static async cancelBooking(
    userId: string,
    bookingId: string
  ) {
    return db.transaction(async (tx) => {
      const booking =
        await BookingCancelRepository.getBookingForCancel(
          tx,
          bookingId,
          userId
        );

      if (!booking) {
        throw new BadRequestError("BOOKING_NOT_FOUND");
      }

      if (!["PENDING", "ACCEPTED"].includes(booking.status)) {
        throw new BadRequestError("BOOKING_NOT_CANCELLABLE");
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const start = new Date(booking.startDate);
      start.setHours(0, 0, 0, 0);

      if (today >= start) {
        throw new ForbiddenError(
          "CANNOT_CANCEL_AFTER_START_DATE"
        );
      }

      const hasAttendance =
        await BookingCancelRepository.hasAttendance(
          tx,
          bookingId
        );

      if (hasAttendance) {
        throw new ForbiddenError(
          "CANNOT_CANCEL_AFTER_ATTENDANCE"
        );
      }

      // restore booked slots
      let cursor = new Date(booking.startDate);
      const end = new Date(booking.endDate);

      while (cursor <= end) {
        const isHoliday =
          await BookingCancelRepository.isHoliday(
            tx,
            booking.facilityId,
            cursor
          );

        if (!isHoliday) {
          await BookingCancelRepository.restoreSlot(
            tx,
            booking.facilityId,
            cursor,
            booking.slotType
          );
        }

        cursor.setDate(cursor.getDate() + 1);
      }

      await BookingCancelRepository.cancelBooking(tx, bookingId);

      return {
        message: "Booking cancelled successfully",
      };
    });
  }
}
