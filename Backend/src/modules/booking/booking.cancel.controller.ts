import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { BookingCancelService } from "./booking.cancel.service";
import { StatusCodes } from "http-status-codes";

export class BookingCancelController {
  static async cancel(req: AuthRequest, res: Response) {
    const { bookingId } = req.params;

    const result = await BookingCancelService.cancelBooking(
      req.user!.userId,
      bookingId
    );

    res.status(StatusCodes.OK).json(result);
  }
}
