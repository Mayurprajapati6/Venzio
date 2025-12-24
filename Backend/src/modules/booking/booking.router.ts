import { Router } from "express";
import { BookingController } from "./booking.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { createBookingSchema } from "../../validators/booking.validator";
import { validateRequestBody } from "../../validators";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("USER"),
  validateRequestBody(createBookingSchema),
  BookingController.create
);

export default router;
