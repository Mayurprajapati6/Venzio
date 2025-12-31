import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { SubscriptionService } from "./subscription.service";
import { StatusCodes } from "http-status-codes";

export class SubscriptionController {
  /**
   * OWNER → check own subscription
   */
  static async getMySubscription(req: AuthRequest, res: Response) {
    const ownerId = req.user!.userId;
    const sub = await SubscriptionService.checkActive(ownerId);

    return res.status(StatusCodes.OK).json({
      active: !!sub,
      subscription: sub,
    });
  }

  /**
   * ADMIN → view all subscriptions
   */
  static async adminGetAll(req: AuthRequest, res: Response) {
    const subs = await SubscriptionService.adminGetAll();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: subs,
    });
  }
}
