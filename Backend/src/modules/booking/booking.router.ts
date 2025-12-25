import { Router } from "express";
import { BookingController } from "./booking.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { createBookingSchema } from "../../validators/booking.validator";
import { validateRequestBody } from "../../validators";
import { BookingCancelController } from "./booking.cancel.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("USER"),
  validateRequestBody(createBookingSchema),
  BookingController.create
);

router.patch(
  "/:bookingId/cancel",
  authenticate,
  authorizeRoles("USER"),
  BookingCancelController.cancel
);


export default router;
