import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { SubscriptionService } from "./subscription.service";
import { AppError } from "../../utils/errors/app.error";
import { StatusCodes } from "http-status-codes";

export class SubscriptionController {
  static async purchase(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.userId;
      const result = await SubscriptionService.purchase(ownerId);

      return res.status(StatusCodes.CREATED).json(result);
    } catch (err) {
      const error = err as AppError;

      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message ?? "Internal Server Error",
      });
    }
  }

  static async getMySubscription(req: AuthRequest, res: Response) {
    const ownerId = req.user!.userId;
    const sub = await SubscriptionService.checkActive(ownerId);

    return res.status(StatusCodes.OK).json({
      active: !!sub,
      subscription: sub,
    });
  }

  static async adminGetAll(req: AuthRequest, res: Response) {
    const subs = await SubscriptionService.adminGetAll();
    return res.status(StatusCodes.OK).json(subs);
  }
}
