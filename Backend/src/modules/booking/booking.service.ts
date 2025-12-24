import { createBookingTransaction } from "./booking.transaction";
import {
  checkIdempotency,
  saveIdempotency,
} from "../../utils/idempotency";
import {
  ConflictError,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  InternalServerError,
} from "../../utils/errors/app.error";

export class BookingService {
  static async create(payload: any) {
    const cached = await checkIdempotency(payload.idempotencyKey);
    if (cached) return cached;

    try {
      const result = await createBookingTransaction(payload);

      await saveIdempotency(payload.idempotencyKey, result);
      return result;
    } catch (err: any) {
      const errorMap: Record<string, any> = {
        SLOT_FULL: new ConflictError("Slot is full"),
        DUPLICATE_ACTIVE_BOOKING: new ConflictError(
          "Active booking already exists"
        ),
        INVALID_PASS_DAYS: new BadRequestError("Invalid pass duration"),
        SLOT_TEMPLATE_NOT_FOUND: new NotFoundError("Slot template not found"),
        FACILITY_NOT_BOOKABLE: new ForbiddenError("Facility not bookable"),
        SLOT_NOT_GENERATED: new NotFoundError("Slots not generated"),
      };

      throw errorMap[err.message] ??
        new InternalServerError("Booking failed");
    }
  }
}
