import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { requireActiveSubscription } from "../../middlewares/ownerSubscription.middleware";
import { FacilityController } from "./facility.controller";
import { validateRequestBody } from "../../validators";
import { createFacilitySchema } from "../../validators/facility.validator";

const router = express.Router();

// OWNER
router.post(
  "/",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  validateRequestBody(createFacilitySchema),
  FacilityController.create
);

router.get(
  "/my",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  FacilityController.myFacilities
);

router.patch(
  "/:facilityId/submit",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  FacilityController.submitForApproval
);

router.delete(
  "/:facilityId",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  FacilityController.delete
);

// ADMIN
router.get(
  "/admin/pending",
  authenticate,
  authorizeRoles("ADMIN"),
  FacilityController.adminPending
);

router.patch(
  "/admin/:facilityId/approve",
  authenticate,
  authorizeRoles("ADMIN"),
  FacilityController.adminApprove
);

router.patch(
  "/admin/:facilityId/reject",
  authenticate,
  authorizeRoles("ADMIN"),
  FacilityController.adminReject
);

export default router;
