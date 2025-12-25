import { db } from "../../db";
import { AttendanceRepository } from "./attendance.repository";
import { parseQR } from "../../utils/helpers/qr";
import {
  BadRequestError,
  ForbiddenError,
} from "../../utils/errors/app.error";

export class AttendanceService {
  static async markAttendance(
    ownerId: string,
    payload: { qrCode: string }
  ) {
    const bookingId = parseQR(payload.qrCode);

    return db.transaction(async (tx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const booking = await AttendanceRepository.getBookingForScan(
        tx,
        bookingId
      );

      if (!booking) {
        throw new BadRequestError("BOOKING_NOT_FOUND");
      }

      if (booking.ownerId !== ownerId) {
        throw new ForbiddenError("NOT_YOUR_FACILITY");
      }

      if (booking.activeDaysRemaining <= 0) {
        throw new BadRequestError("PASS_EXPIRED");
      }

      const alreadyMarked =
        await AttendanceRepository.alreadyMarked(
          tx,
          bookingId,
          today
        );

      if (alreadyMarked) {
        throw new BadRequestError("ALREADY_MARKED_TODAY");
      }

      const holiday = await AttendanceRepository.isHoliday(
        tx,
        booking.facilityId,
        today
      );

      if (holiday) {
        throw new BadRequestError("HOLIDAY_NO_ATTENDANCE");
      }

      await AttendanceRepository.insertAttendance(
        tx,
        bookingId,
        booking.facilityId,
        today
      );

      await AttendanceRepository.decrementActiveDay(
        tx,
        bookingId
      );

      if (booking.activeDaysRemaining === 1) {
        await AttendanceRepository.completeBooking(
          tx,
          bookingId
        );
      }

      return {
        message: "Attendance marked",
        remainingDays: booking.activeDaysRemaining - 1,
      };
    });
  }
}
