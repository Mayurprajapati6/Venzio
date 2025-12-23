import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { HolidayService } from "./holiday.service";
import { StatusCodes } from "http-status-codes";

export class HolidayController {
  static async add(req: AuthRequest, res: Response) {
    await HolidayService.addHoliday(req.user!.userId, req.body);
    res
      .status(StatusCodes.CREATED)
      .json({ message: "Holiday period added" });
  }

  static async list(req: AuthRequest, res: Response) {
    const { facilityId } = req.params;

    const holidays = await HolidayService.list(
      req.user!.userId,
      facilityId
    );

    res.status(StatusCodes.OK).json(holidays);
  }

  static async remove(req: AuthRequest, res: Response) {
    const { facilityId, startDate, endDate } = req.params;

    await HolidayService.remove(
      req.user!.userId,
      facilityId,
      startDate,
      endDate
    );

    res
      .status(StatusCodes.OK)
      .json({ message: "Holiday removed" });
  }
}
