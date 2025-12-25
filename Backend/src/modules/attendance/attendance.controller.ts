import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AttendanceService } from "./attendance.service";
import { StatusCodes } from "http-status-codes";

export class AttendanceController {
  static async mark(req: AuthRequest, res: Response) {
    const result = await AttendanceService.markAttendance(
      req.user!.userId,
      req.body
    );

    res.status(StatusCodes.OK).json(result);
  }
}
