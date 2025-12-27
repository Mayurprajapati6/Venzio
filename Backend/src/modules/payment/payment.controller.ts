import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { PaymentService } from "./payment.service";
import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  NotFoundError,
} from "../../utils/errors/app.error";

export class PaymentController {
  
  static async createOrderForBooking(req: AuthRequest, res: Response) {
    try {
      const { bookingId } = req.params;
      const userId = req.user!.userId;

      if (!bookingId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Booking ID is required",
        });
      }

      const order = await PaymentService.createOrderForBooking(
        bookingId,
        userId
      );

      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: order,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err.statusCode ||
        (err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : err instanceof BadRequestError
          ? StatusCodes.BAD_REQUEST
          : StatusCodes.INTERNAL_SERVER_ERROR);

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to create payment order",
      });
    }
  }

  
  static async createOrderForSubscription(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.userId;

      const order = await PaymentService.createOrderForSubscription(ownerId);

      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: order,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err.statusCode ||
        (err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : err instanceof BadRequestError
          ? StatusCodes.BAD_REQUEST
          : StatusCodes.INTERNAL_SERVER_ERROR);

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to create payment order",
      });
    }
  }

  
  static async handleWebhook(req: any, res: Response) {
    try {
      
      const rawBody = req.rawBody || JSON.stringify(req.body);
      const signature = req.headers["x-razorpay-signature"] as string;

      if (!signature) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Missing Razorpay signature",
        });
      }

    
      const isValid = PaymentService.verifyWebhookSignature(
        rawBody,
        signature
      );

      if (!isValid) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Invalid webhook signature",
        });
      }

      const webhookPayload = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
      const event = webhookPayload.event;

      
      if (event === "payment.captured") {
        await PaymentService.handlePaymentSuccess(webhookPayload);
      } else if (event === "payment.failed") {
        await PaymentService.handlePaymentFailure(webhookPayload);
      } else {
        
        console.log(`Unhandled webhook event: ${event}`);
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Webhook processed",
      });
    } catch (err: any) {
      const error = err as Error;
      console.error("Webhook error:", error);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Webhook processing failed",
      });
    }
  }

  
  static async getPaymentStatusForBooking(req: AuthRequest, res: Response) {
    try {
      const { bookingId } = req.params;
      const userId = req.user!.userId;

      if (!bookingId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Booking ID is required",
        });
      }

      const payment = await PaymentService.getPaymentStatusForBooking(
        bookingId,
        userId
      );

      if (!payment) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Payment not found for this booking",
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        data: payment,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err.statusCode ||
        (err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : StatusCodes.INTERNAL_SERVER_ERROR);

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to get payment status",
      });
    }
  }

  
  static async getPaymentStatusForSubscription(req: AuthRequest, res: Response) {
    try {
      const { subscriptionId } = req.params;
      const ownerId = req.user!.userId;

      if (!subscriptionId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Subscription ID is required",
        });
      }

      const payment = await PaymentService.getPaymentStatusForSubscription(
        subscriptionId,
        ownerId
      );

      if (!payment) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Payment not found for this subscription",
        });
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        data: payment,
      });
    } catch (err: any) {
      const error = err as Error;
      const statusCode =
        err.statusCode ||
        (err instanceof NotFoundError
          ? StatusCodes.NOT_FOUND
          : StatusCodes.INTERNAL_SERVER_ERROR);

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to get payment status",
      });
    }
  }
}

