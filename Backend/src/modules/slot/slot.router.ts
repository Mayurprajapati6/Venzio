import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { requireActiveSubscription } from "../../middlewares/ownerSubscription.middleware";
import { SlotController } from "./slot.controller";

const router = express.Router();

/* =======================
   SLOT TEMPLATE ROUTES
======================= */

router.post(
  "/templates",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  SlotController.createTemplate
);

router.get(
  "/templates/:facilityId",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  SlotController.listTemplates
);

router.patch(
  "/templates/:templateId/capacity",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  SlotController.updateCapacity
);

export default router;
