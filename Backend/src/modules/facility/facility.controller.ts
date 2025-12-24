import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { FacilityService } from "./facility.service";
import { StatusCodes } from "http-status-codes";

export class FacilityController {
  static async create(req: AuthRequest, res: Response) {
    const result = await FacilityService.create(req.user!.userId, req.body);
    res.status(StatusCodes.CREATED).json(result);
  }

  static async publish(req: AuthRequest, res: Response) {
    await FacilityService.publish(req.user!.userId, req.params.facilityId);
    res.status(StatusCodes.OK).json({ message: "Published" });
  }

  static async myFacilities(req: AuthRequest, res: Response) {
    const ownerId = req.user!.userId;
    res.status(StatusCodes.OK).json(await FacilityService.listMyFacilities(ownerId));
  }


  static async unpublish(req: AuthRequest, res: Response) {
    await FacilityService.unpublish(req.user!.userId, req.params.facilityId);
    res.status(StatusCodes.OK).json({ message: "Facility unpublished" });
  }

  static async delete(req: AuthRequest, res: Response) {
    await FacilityService.delete(req.user!.userId, req.params.facilityId);
    res.status(StatusCodes.OK).json({ message: "Facility deleted" });
  }

  // ADMIN
  static async adminPending(req: AuthRequest, res: Response) {
    res
      .status(StatusCodes.OK)
      .json(await FacilityService.adminPending());
  }

  static async adminApprove(req: AuthRequest, res: Response) {
    await FacilityService.adminApprove(req.params.facilityId);
    res.status(StatusCodes.OK).json({ message: "Approved" });
  }

  static async adminReject(req: AuthRequest, res: Response) {
    await FacilityService.adminReject(
      req.params.facilityId,
      req.body.reason
    );
    res.status(StatusCodes.OK).json({ message: "Rejected" });
  }
}


