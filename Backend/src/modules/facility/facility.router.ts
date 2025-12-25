import express from 'express'
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { requireActiveSubscription } from "../../middlewares/ownerSubscription.middleware";
import { FacilityController } from "./facility.controller";
import { createFacilitySchema } from '../../validators/facility.validator';
import { validateRequestBody } from '../../validators';

const router = express.Router();

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
  "/:facilityId/publish",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  FacilityController.publish
);

router.patch(
  "/:facilityId/unpublish",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  FacilityController.unpublish
);

router.delete(
  "/:facilityId",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  FacilityController.delete
);

router.patch(
  "/:facilityId/submit",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  FacilityController.submitForApproval
);

// ADMIN ROUTES
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