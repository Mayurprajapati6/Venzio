import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { OwnerDashboardController } from "./ownerDashboard.controller";

const router = express.Router();

// All routes require authentication and OWNER role
router.use(authenticate);
router.use(authorizeRoles("OWNER"));

// Get revenue analytics
router.get("/revenue", OwnerDashboardController.getRevenue);

// Get payout history
router.get("/payouts", OwnerDashboardController.getPayouts);

// Get recent check-ins
router.get("/checkins", OwnerDashboardController.getCheckIns);

// Get facility users view
router.get("/facilities/users", OwnerDashboardController.getFacilityUsers);

// Get quick counts/summary
router.get("/summary", OwnerDashboardController.getQuickCounts);

// facilities reviews
router.get("/facilities/:facilityId/reviews", OwnerDashboardController.getFacilityReviews);

export default router;

