/**
 * @file dispute.routes.ts
 * Express routes for Dispute module
 */

import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { DisputeController } from "./dispute.controller";

const router = express.Router();

// USER routes
router.post(
  "/",
  authenticate,
  authorizeRoles("USER"),
  DisputeController.create
);

router.get(
  "/my",
  authenticate,
  authorizeRoles("USER"),
  DisputeController.getMyDisputes
);

router.get(
  "/booking/:bookingId",
  authenticate,
  DisputeController.getByBookingId
);

router.get(
  "/:disputeId",
  authenticate,
  DisputeController.getById
);

// OWNER routes
router.get(
  "/owner/my",
  authenticate,
  authorizeRoles("OWNER"),
  DisputeController.getOwnerDisputes
);

// ADMIN routes
router.get(
  "/admin",
  authenticate,
  authorizeRoles("ADMIN"),
  DisputeController.getAllDisputes
);

router.patch(
  "/:disputeId/resolve",
  authenticate,
  authorizeRoles("ADMIN"),
  DisputeController.resolve
);

export default router;

