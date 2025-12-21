import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { SubscriptionService } from "../modules/subscription/subscription.service";
import { ForbiddenError, AppError } from "../utils/errors/app.error";
import { StatusCodes } from "http-status-codes";

export async function requireActiveSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const ownerId = req.user!.userId;
    const sub = await SubscriptionService.checkActive(ownerId);

    if (!sub) {
      throw new ForbiddenError("Active subscription required");
    }

    next();
  } catch (err) {
    const error = err as AppError;

    return res.status(error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message ?? "Internal Server Error",
    });
  }
}
