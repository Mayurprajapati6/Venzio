/**
 * @file adminDashboard.routes.ts
 * Express routes for Admin Dashboard module
 */

import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { AdminDashboardController } from "./adminDashboard.controller";

const router = express.Router();

// All routes require authentication and ADMIN role only
router.use(authenticate);
router.use(authorizeRoles("ADMIN"));

// Dashboard Overview
router.get("/dashboard/overview", AdminDashboardController.getOverview);

// Monthly Revenue
router.get(
  "/dashboard/revenue/monthly",
  AdminDashboardController.getMonthlyRevenue
);

// Revenue by Category
router.get(
  "/dashboard/revenue/by-category",
  AdminDashboardController.getRevenueByCategory
);

// Owners Management
router.get("/owners", AdminDashboardController.getOwnersList);
router.get("/owners/:ownerId", AdminDashboardController.getOwnerDetails);

// Users Management
router.get("/users", AdminDashboardController.getUsersList);
router.get("/users/:userId", AdminDashboardController.getUserDetails);

// Escrow & Payout Analytics
router.get("/escrow/overview", AdminDashboardController.getEscrowOverview);
router.get(
  "/escrow/transactions",
  AdminDashboardController.getEscrowTransactions
);

// Platform Earnings
router.get("/platform/earnings", AdminDashboardController.getPlatformEarnings);

// Admin Controls (Escrow Override)
router.post("/escrow/:escrowId/block", AdminDashboardController.blockEscrow);
router.post(
  "/escrow/:escrowId/release",
  AdminDashboardController.releaseEscrow
);

// block user/owner
router.post("/users/:userId/block", AdminDashboardController.blockUser);
router.post("/owners/:ownerId/block", AdminDashboardController.blockOwner);

export default router;

