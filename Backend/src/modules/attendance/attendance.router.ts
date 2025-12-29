/**
 * @file attendance.router.ts
 * Express routes for Attendance module
 */

import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";

const router = Router();

// Scan QR code (preview only - does NOT mark attendance)
router.post(
  "/scan",
  authenticate,
  authorizeRoles("OWNER"),
  AttendanceController.scan
);

// Mark attendance (final action - requires bookingId)
router.post(
  "/mark",
  authenticate,
  authorizeRoles("OWNER"),
  AttendanceController.mark
);

export default router;
