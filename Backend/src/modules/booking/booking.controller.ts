import { Response } from "express";
import { BookingService } from "./booking.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { StatusCodes } from "http-status-codes";

export class BookingController {
  static async create(req: AuthRequest, res: Response) {
    const idempotencyKey = req.headers["idempotency-key"] as string;

    if (!idempotencyKey) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "IDEMPOTENCY_KEY_REQUIRED",
      });
    }

    const result = await BookingService.create({
      ...req.body,
      userId: req.user!.userId,
      idempotencyKey,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
    });
  }
}
