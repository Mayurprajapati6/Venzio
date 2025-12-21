import { randomUUID } from "crypto";
import { SubscriptionRepository } from "./subscription.repository";
import { ConflictError } from "../../utils/errors/app.error";

const SUBSCRIPTION_DURATION_DAYS = 90;

export class SubscriptionService {
  static async purchase(ownerId: string) {
    const existing = await SubscriptionRepository.getActiveByOwner(ownerId);

    if (existing) {
      throw new ConflictError("Active subscription already exists");
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + SUBSCRIPTION_DURATION_DAYS);

    await SubscriptionRepository.create({
      id: randomUUID(),
      ownerId,
      startDate,
      endDate,
    });

    return {
      message: "Subscription activated successfully",
      startDate,
      endDate,
    };
  }

  static async checkActive(ownerId: string) {
    return SubscriptionRepository.getActiveByOwner(ownerId);
  }

  static async adminGetAll() {
    return SubscriptionRepository.getAll();
  }
}
