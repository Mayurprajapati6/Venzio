import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { UserDashboardController } from "./userDashboard.controller";

const router = express.Router();

// All routes require authentication and USER role
router.use(authenticate);
router.use(authorizeRoles("USER"));

// Get user passes
router.get("/passes", UserDashboardController.getPasses);

// Get spending analytics
router.get("/spending", UserDashboardController.getSpending);

// Get streaks and visits
router.get("/streaks", UserDashboardController.getStreaks);

// Get category insights
router.get("/categories", UserDashboardController.getCategories);

// pending reviews
router.get("/reviews/pending",UserDashboardController.getPendingReviews);

// All reviews
router.get("/reviews/my",UserDashboardController.getMyReviews);

export default router;

