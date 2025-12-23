import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { SlotService } from "./slot.service";
import { StatusCodes } from "http-status-codes";

export class SlotController {
  static async createTemplate(req: AuthRequest, res: Response) {
    await SlotService.createTemplate(req.user!.userId, req.body);
    res
      .status(StatusCodes.CREATED)
      .json({ message: "Slot template created" });
  }

  static async listTemplates(req: AuthRequest, res: Response) {
    const { facilityId } = req.params;

    const templates = await SlotService.listTemplates(
      req.user!.userId,
      facilityId
    );

    res.status(StatusCodes.OK).json(templates);
  }

  static async updateCapacity(req: AuthRequest, res: Response) {
    const { templateId } = req.params;
    const { facilityId, slotType, capacity } = req.body;

    await SlotService.updateCapacity(
      req.user!.userId,
      templateId,
      facilityId,
      slotType,
      capacity
    );

    res.status(StatusCodes.OK).json({
      message: "Capacity updated",
    });
  }
}
