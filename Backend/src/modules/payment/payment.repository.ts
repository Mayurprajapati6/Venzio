import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { payments } from "../../db/schema";

export class PaymentRepository {
  static async create(data: {
    id: string;
    razorpayOrderId: string;
    entityType: "BOOKING" | "SUBSCRIPTION";
    entityId: string;
    amount: number;
    currency?: string;
    metadata?: any;
  }) {
    await db.insert(payments).values({
      ...data,
      currency: data.currency || "INR",
      status: "PENDING",
    });
  }

  static async findByRazorpayOrderId(razorpayOrderId: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, razorpayOrderId))
      .limit(1);

    return payment ?? null;
  }

  static async findByEntity(
    entityType: "BOOKING" | "SUBSCRIPTION",
    entityId: string
  ) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.entityType, entityType),
          eq(payments.entityId, entityId)
        )
      )
      .limit(1);

    return payment ?? null;
  }

  static async updateStatus(
    razorpayOrderId: string,
    status: "PENDING" | "CAPTURED" | "FAILED" | "REFUNDED",
    razorpayPaymentId?: string | null,
    paymentMethod?: string | null,
    metadata?: any
  ) {
    await db
      .update(payments)
      .set({
        status,
        razorpayPaymentId: razorpayPaymentId ?? undefined,
        paymentMethod: paymentMethod ?? undefined,
        metadata: metadata ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(payments.razorpayOrderId, razorpayOrderId));
  }

  static async findById(id: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    return payment ?? null;
  }

  static async updateEntityId(
    razorpayOrderId: string,
    entityId: string
  ) {
    await db
      .update(payments)
      .set({
        entityId,
        updatedAt: new Date(),
      })
      .where(eq(payments.razorpayOrderId, razorpayOrderId));
  }

  static async findByRazorpayPaymentId(razorpayPaymentId: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayPaymentId, razorpayPaymentId))
      .limit(1);

    return payment ?? null;
  }

  /**
   * Lock payment row for update (used in transactions)
   * Returns payment with row lock to prevent race conditions
   */
  static async findByRazorpayOrderIdLocked(
    tx: any,
    razorpayOrderId: string
  ) {
    const rows = await tx.execute(
      `SELECT * FROM payments WHERE razorpay_order_id = ? FOR UPDATE`,
      [razorpayOrderId]
    ) as any[];

    return rows[0] ?? null;
  }
}

