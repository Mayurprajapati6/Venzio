import { db } from "../../db";
import { randomUUID } from "crypto";
import { BookingRepository } from "./booking.repository";
import {
  BookingStatus,
  PLATFORM_FEE_MAP,
  ALLOWED_PASS_DAYS,
} from "./booking.constants";

export async function createBookingTransaction(payload: any) {
  return db.transaction(async (tx) => {
    const {
      userId,
      facilityId,
      slotType,
      passDays,
      startDate,
      idempotencyKey,
    } = payload;

    if (!ALLOWED_PASS_DAYS.includes(passDays)) {
      throw new Error("INVALID_PASS_DAYS");
    }

    const canBook = await BookingRepository.verifyFacilityBookable(
      tx,
      facilityId
    );
    if (!canBook) throw new Error("FACILITY_NOT_BOOKABLE");

    const duplicate = await BookingRepository.hasActiveBooking(
      tx,
      userId,
      facilityId,
      slotType
    );
    if (duplicate) throw new Error("DUPLICATE_ACTIVE_BOOKING");

    const template = await BookingRepository.getSlotTemplate(
      tx,
      facilityId,
      slotType
    );
    if (!template) throw new Error("SLOT_TEMPLATE_NOT_FOUND");

    // ✅ ADD: explicit pass support check
    let baseAmount: number | null = null;

    if (passDays === 1) baseAmount = template.price1Day;
    if (passDays === 3) baseAmount = template.price3Day;
    if (passDays === 7) baseAmount = template.price7Day;

    if (baseAmount == null) {
      throw new Error("PASS_NOT_SUPPORTED");
    }

    const platformFee = PLATFORM_FEE_MAP[passDays];

    let remainingDays = passDays;
    let cursor = new Date(startDate);
    let endDate = new Date(startDate);

    while (remainingDays > 0) {
      const isHoliday = await BookingRepository.isHoliday(
        tx,
        facilityId,
        cursor
      );

      if (!isHoliday) {
        const slot = await BookingRepository.lockFacilitySlot(
          tx,
          facilityId,
          cursor,
          slotType
        );

        if (!slot) throw new Error("SLOT_NOT_AVAILABLE");
        if (slot.booked >= slot.capacity)
          throw new Error("SLOT_FULL");

        await BookingRepository.incrementBooked(tx, slot.id);
        remainingDays--;
      }

      endDate = new Date(cursor);
      cursor.setDate(cursor.getDate() + 1);
    }

    const bookingId = randomUUID();

    await BookingRepository.insertBooking(tx, {
      id: bookingId,
      userId,
      facilityId,
      slotType,
      passDays,
      startDate,
      endDate,
      activeDaysRemaining: passDays,
      baseAmount,
      platformFee,
      totalAmount: baseAmount + platformFee,
      status: BookingStatus.ACCEPTED,
      idempotencyKey,
      qrCode: `QR-${bookingId}`,
    });

    return {
      bookingId,
      status: BookingStatus.ACCEPTED,
      startDate,
      endDate,
      activeDaysRemaining: passDays,
      qrCode: `QR-${bookingId}`,
    };
  });
}
