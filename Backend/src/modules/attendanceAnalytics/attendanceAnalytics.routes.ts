import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { AttendanceAnalyticsController } from "./attendanceAnalytics.controller";

const router = express.Router();

// All routes require authentication and USER role only
router.use(authenticate);
router.use(authorizeRoles("USER"));

// Get attendance calendar
router.get("/calendar", AttendanceAnalyticsController.getCalendar);

// Get streaks
router.get("/streaks", AttendanceAnalyticsController.getStreaks);

// Get monthly attendance
router.get("/monthly", AttendanceAnalyticsController.getMonthlyAttendance);

// Get yearly attendance
router.get("/yearly", AttendanceAnalyticsController.getYearlyAttendance);

// Get attendance detail for a specific date
router.get("/:date", AttendanceAnalyticsController.getAttendanceDetail);

export default router;

