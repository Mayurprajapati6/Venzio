/**
 * @file escrow.routes.ts
 * Express routes for Escrow module
 */

import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { EscrowController } from "./escrow.controller";

const router = express.Router();

// Admin routes
router.get(
  "/booking/:bookingId",
  authenticate,
  authorizeRoles("ADMIN", "OWNER"),
  EscrowController.getByBookingId
);

router.patch(
  "/:escrowId/release",
  authenticate,
  authorizeRoles("ADMIN"),
  EscrowController.forceRelease
);

router.patch(
  "/:escrowId/block",
  authenticate,
  authorizeRoles("ADMIN"),
  EscrowController.block
);

router.patch(
  "/:escrowId/refund",
  authenticate,
  authorizeRoles("ADMIN"),
  EscrowController.forceRefund
);

router.get(
  "/dashboard/admin",
  authenticate,
  authorizeRoles("ADMIN"),
  EscrowController.adminDashboard
);

router.get(
  "/dashboard/owner",
  authenticate,
  authorizeRoles("OWNER"),
  EscrowController.ownerDashboard
);

export default router;

