import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { SubscriptionController } from "./subscription.controller";

const router = express.Router();


router.get(
  "/me",
  authenticate,
  authorizeRoles("OWNER"),
  SubscriptionController.getMySubscription
);

router.get(
  "/admin/all",
  authenticate,
  authorizeRoles("ADMIN"),
  SubscriptionController.adminGetAll
);

export default router;
