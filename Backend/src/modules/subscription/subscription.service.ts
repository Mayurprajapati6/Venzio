import { randomUUID } from "crypto";
import { SubscriptionRepository } from "./subscription.repository";
import { ConflictError } from "../../utils/errors/app.error";

const SUBSCRIPTION_DURATION_DAYS = 90;

export class SubscriptionService {
  static async purchaseTx(tx: any, ownerId: string) {
    const existing = await SubscriptionRepository.getActiveByOwner(ownerId);

    if (existing) {
      throw new ConflictError("Active subscription already exists");
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + SUBSCRIPTION_DURATION_DAYS);

    const id = randomUUID();

    await tx.insert("owner_subscriptions").values({
      id,
      owner_id: ownerId,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    });

    return {
      message: "Subscription activated successfully",
      id,
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
