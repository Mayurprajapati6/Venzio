import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";

const router = Router();

router.post(
  "/scan",
  authenticate,
  authorizeRoles("OWNER"),
  AttendanceController.mark
);

export default router;
