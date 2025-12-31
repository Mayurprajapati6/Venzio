import express from "express";
import { ReviewController } from "./review.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { validateRequestBody } from "../../validators";
import { createReviewSchema } from "../../validators/review.validator";

const router = express.Router();

// Create review (USER only)
router.post(
  "/",
  authenticate,
  authorizeRoles("USER"),
  validateRequestBody(createReviewSchema),
  ReviewController.create
);

// Get reviews for facility (public, no auth required)
router.get("/facility/:facilityId", ReviewController.getByFacilityId);

// Get all reviews (ADMIN only)
router.get(
  "/admin",
  authenticate,
  authorizeRoles("ADMIN"),
  ReviewController.getAll
);

// Get review by ID (authenticated users)
router.get("/:reviewId", authenticate, ReviewController.getById);

// Get review by booking ID (authenticated users)
router.get(
  "/booking/:bookingId",
  authenticate,
  ReviewController.getByBookingId
);

export default router;

