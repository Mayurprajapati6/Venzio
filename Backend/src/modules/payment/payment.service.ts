import { randomUUID } from "crypto";
import { razorpay, RAZORPAY_WEBHOOK_SECRET } from "../../lib/razorpay";
import { PaymentRepository } from "./payment.repository";
import { db } from "../../db";
import { bookings, ownerSubscriptions } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  NotFoundError,
  BadRequestError,
  InternalServerError,
  ConflictError,
} from "../../utils/errors/app.error";
import { PaymentMetadata } from "./payment.types";
import crypto from "crypto";
import { SubscriptionService } from "../subscription/subscription.service";
import { EscrowService } from "../escrow/escrow.service";

const SUBSCRIPTION_AMOUNT = 99900; // ₹999.00 in paise (90 days subscription)

export class PaymentService {
  
  
   
  static async createOrderForBooking(bookingId: string, userId: string) {
    
    const [booking] = await db
      .select()
      .from(bookings)
      .where(
        and(eq(bookings.id, bookingId), eq(bookings.userId, userId))
      )
      .limit(1);

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    
    if (booking.status !== "ACCEPTED") {
      throw new BadRequestError(
        `Payment can only be initiated for ACCEPTED bookings. Current status: ${booking.status}`
      );
    }

    
    const existingPayment = await PaymentRepository.findByEntity(
      "BOOKING",
      bookingId
    );

    if (existingPayment) {
      if (existingPayment.status === "CAPTURED") {
        throw new ConflictError("Payment already completed for this booking");
      }
      
      return {
        orderId: existingPayment.razorpayOrderId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      };
    }

    
    const amount = booking.totalAmount; 
    const currency = "INR";

    const razorpayOrder = await razorpay.orders.create({
      amount: amount,
      currency: currency,
      receipt: `booking_${bookingId}_${Date.now()}`,
      notes: {
        bookingId: bookingId,
        userId: userId,
        entityType: "BOOKING",
      },
    });

    
    const paymentId = randomUUID();
    await PaymentRepository.create({
      id: paymentId,
      razorpayOrderId: razorpayOrder.id,
      entityType: "BOOKING",
      entityId: bookingId,
      amount: amount,
      currency: currency,
      metadata: {
        receipt: razorpayOrder.receipt,
        notes: razorpayOrder.notes,
      },
    });

    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }


  //Create Razorpay order for subscription payment
   
  static async createOrderForSubscription(ownerId: string) {
    
    const existingSubscription = await SubscriptionService.checkActive(ownerId);
    if (existingSubscription) {
      throw new ConflictError("Active subscription already exists");
    }

    
    const amount = SUBSCRIPTION_AMOUNT;
    const currency = "INR";

    const razorpayOrder = await razorpay.orders.create({
      amount: amount,
      currency: currency,
      receipt: `subscription_${ownerId}_${Date.now()}`,
      notes: {
        ownerId: ownerId,
        entityType: "SUBSCRIPTION",
      },
    });

    
    const paymentId = randomUUID();
    const tempSubscriptionId = `temp_${ownerId}_${Date.now()}`;
    await PaymentRepository.create({
      id: paymentId,
      razorpayOrderId: razorpayOrder.id,
      entityType: "SUBSCRIPTION",
      entityId: tempSubscriptionId,
      amount: amount,
      currency: currency,
      metadata: {
        receipt: razorpayOrder.receipt,
        notes: razorpayOrder.notes,
        ownerId: ownerId,
        tempSubscriptionId: tempSubscriptionId,
      },
    });

    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  
  static verifyWebhookSignature(
    payload: string,
    signature: string
  ): boolean {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      throw new InternalServerError("Webhook secret not configured");
    }

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  
  static async handlePaymentSuccess(webhookPayload: any) {
    return db.transaction(async (tx) => {
      const paymentEntity = webhookPayload.payload?.payment?.entity;
      if (!paymentEntity) {
        throw new BadRequestError("Invalid webhook payload structure");
      }

      const order_id = paymentEntity.order_id;
      const payment_id = paymentEntity.id;
      const method = paymentEntity.method;
      const webhookAmount = paymentEntity.amount; // Amount from webhook
      const webhookCurrency = paymentEntity.currency || "INR";

      // Lock payment row to prevent race conditions
      const payment = await PaymentRepository.findByRazorpayOrderIdLocked(
        tx,
        order_id
      );
      if (!payment) {
        throw new NotFoundError(`Payment not found for order: ${order_id}`);
      }

      // Idempotency check: already processed
      if (payment.status === "CAPTURED") {
        return {
          success: true,
          message: "Payment already processed",
          paymentId: payment.id,
        };
      }

      // CRITICAL: Validate webhook payload against stored payment
      if (payment.amount !== webhookAmount) {
        throw new BadRequestError(
          `Amount mismatch: stored=${payment.amount}, webhook=${webhookAmount}`
        );
      }

      if (payment.currency !== webhookCurrency) {
        throw new BadRequestError(
          `Currency mismatch: stored=${payment.currency}, webhook=${webhookCurrency}`
        );
      }

      // Update payment status (within transaction)
      await tx.execute(
        sql`UPDATE payments 
            SET status = 'CAPTURED', 
                razorpay_payment_id = ${payment_id},
                payment_method = ${method ?? null},
                metadata = JSON_MERGE_PATCH(
                  COALESCE(metadata, '{}'),
                  ${JSON.stringify(webhookPayload.payload)}
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE razorpay_order_id = ${order_id}`
      );

      
      if (payment.entityType === "BOOKING") {
        // Lock booking row and verify status
        const bookingRows = await tx.execute(
          sql`SELECT * FROM bookings WHERE id = ${payment.entityId} FOR UPDATE`
        ) as any[];
        const booking = bookingRows[0];

        if (!booking) {
          throw new NotFoundError("Booking not found");
        }

        // Prevent duplicate ACTIVE status transition
        if (booking.status === "ACTIVE") {
          // Already active, skip update but return success
          return {
            success: true,
            message: "Payment processed, booking already active",
            paymentId: payment.id,
          };
        }

        // Only allow ACCEPTED -> ACTIVE transition
        if (booking.status !== "ACCEPTED") {
          throw new BadRequestError(
            `Cannot activate booking. Current status: ${booking.status}`
          );
        }

        // Update booking status to ACTIVE
        await tx.execute(
          sql`UPDATE bookings SET status = 'ACTIVE' WHERE id = ${payment.entityId}`
        );

        // Create escrow after payment success
        const facilityRows = await tx.execute(
          sql`SELECT * FROM facilities WHERE id = ${booking.facility_id}`
        ) as any[];
        const facility = facilityRows[0];

        if (facility) {
          // Calculate release date: booking.endDate + 1 day
          const releaseDate = new Date(booking.end_date);
          releaseDate.setDate(releaseDate.getDate() + 1);

          try {
            await EscrowService.createAfterPayment({
              bookingId: booking.id,
              ownerId: facility.owner_id,
              amountHeld: booking.total_amount,
              platformFee: booking.platform_fee,
              releaseDate,
            });
          } catch (error: any) {
            // Log error but don't fail payment processing
            console.error("Failed to create escrow:", error.message);
          }
        }
      } else if (payment.entityType === "SUBSCRIPTION") {
        const metadata = payment.metadata as PaymentMetadata | null;
        const ownerId = metadata?.ownerId || metadata?.notes?.ownerId;

        if (!ownerId) {
          throw new InternalServerError("Owner ID not found in payment metadata");
        }

    
        const { id: subscriptionId } =
          await SubscriptionService.purchaseTx(tx, ownerId);

        await tx.execute(
          sql`UPDATE payments
              SET entity_id = ${subscriptionId},
                  updated_at = CURRENT_TIMESTAMP
              WHERE razorpay_order_id = ${order_id}`
        );
      }

      return {
        success: true,
        message: "Payment processed successfully",
        paymentId: payment.id,
      };
    });
  }

  
  static async handlePaymentFailure(webhookPayload: any) {
    return db.transaction(async (tx) => {
      const paymentEntity = webhookPayload.payload?.payment?.entity;
      if (!paymentEntity) {
        throw new BadRequestError("Invalid webhook payload structure");
      }

      const order_id = paymentEntity.order_id;
      const payment_id = paymentEntity.id;
      const method = paymentEntity.method;

      // Lock payment row
      const payment = await PaymentRepository.findByRazorpayOrderIdLocked(
        tx,
        order_id
      );
      if (!payment) {
        throw new NotFoundError(`Payment not found for order: ${order_id}`);
      }

      // Idempotency: already processed
      if (payment.status === "FAILED" || payment.status === "CAPTURED") {
        return {
          success: true,
          message: "Payment status already updated",
          paymentId: payment.id,
          status: payment.status,
        };
      }

      // Update payment status
      await tx.execute(
        sql`UPDATE payments 
            SET status = 'FAILED', 
                razorpay_payment_id = ${payment_id ?? null},
                payment_method = ${method ?? null},
                metadata = JSON_MERGE_PATCH(COALESCE(metadata, '{}'), ${JSON.stringify(webhookPayload.payload)}),
                updated_at = CURRENT_TIMESTAMP
            WHERE razorpay_order_id = ${order_id}`
      );

      return {
        success: true,
        message: "Payment failure recorded",
        paymentId: payment.id,
      };
    });
  }

  
  static async getPaymentStatusForBooking(
    bookingId: string,
    userId: string
  ) {
    
    const [booking] = await db
      .select()
      .from(bookings)
      .where(
        and(eq(bookings.id, bookingId), eq(bookings.userId, userId))
      )
      .limit(1);

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const payment = await PaymentRepository.findByEntity("BOOKING", bookingId);
    return payment;
  }

  
  //Get payment status for subscription
  
  static async getPaymentStatusForSubscription(
    subscriptionId: string,
    ownerId: string
  ) {
    
    const [subscription] = await db
      .select()
      .from(ownerSubscriptions)
      .where(
        and(
          eq(ownerSubscriptions.id, subscriptionId),
          eq(ownerSubscriptions.ownerId, ownerId)
        )
      )
      .limit(1);

    if (!subscription) {
      throw new NotFoundError("Subscription not found");
    }

    const payment = await PaymentRepository.findByEntity(
      "SUBSCRIPTION",
      subscriptionId
    );
    return payment;
  }

  /**
   * Execute Razorpay refund
   * Called by Escrow service
   */
  static async refund(
    razorpayPaymentId: string,
    amount: number,
    reason?: string
  ) {
    try {
      // Create refund via Razorpay
      const refund = await razorpay.payments.refund(razorpayPaymentId, {
        amount: amount, // Amount in paise
        notes: {
          reason: reason || "Escrow refund",
        },
      });

      // Update payment status to REFUNDED
      const payment = await PaymentRepository.findByRazorpayPaymentId(
        razorpayPaymentId
      );
      if (payment) {
        await PaymentRepository.updateStatus(
          payment.razorpayOrderId,
          "REFUNDED",
          razorpayPaymentId,
          payment.paymentMethod,
          { refund_id: refund.id }
        );
      }

      return {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (error: any) {
      throw new InternalServerError(
        `Razorpay refund failed: ${error.message}`
      );
    }
  }

  /**
   * Get payment by booking ID
   * Used by Escrow service
   */
  static async getPaymentByBookingId(bookingId: string) {
    return await PaymentRepository.findByEntity("BOOKING", bookingId);
  }
}

