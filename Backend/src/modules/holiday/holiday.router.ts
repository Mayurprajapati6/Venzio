import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { requireActiveSubscription } from "../../middlewares/ownerSubscription.middleware";
import { HolidayController } from "./holiday.controller";

const router = express.Router();

/* =======================
   HOLIDAY ROUTES
======================= */

router.post(
  "/",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  HolidayController.add
);

router.get(
  "/:facilityId",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  HolidayController.list
);

router.delete(
  "/:facilityId/:startDate/:endDate",
  authenticate,
  authorizeRoles("OWNER"),
  requireActiveSubscription,
  HolidayController.remove
);

export default router;
