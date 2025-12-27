import express from "express";
import { PaymentController } from "./payment.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";

const router = express.Router();

// Webhook endpoint - no authentication (uses signature verification)
router.post("/webhook", PaymentController.handleWebhook);


router.post(
  "/booking/:bookingId",
  authenticate,
  authorizeRoles("USER"),
  PaymentController.createOrderForBooking
);

router.get(
  "/booking/:bookingId",
  authenticate,
  authorizeRoles("USER"),
  PaymentController.getPaymentStatusForBooking
);


router.post(
  "/subscription",
  authenticate,
  authorizeRoles("OWNER"),
  PaymentController.createOrderForSubscription
);

router.get(
  "/subscription/:subscriptionId",
  authenticate,
  authorizeRoles("OWNER"),
  PaymentController.getPaymentStatusForSubscription
);

export default router;

