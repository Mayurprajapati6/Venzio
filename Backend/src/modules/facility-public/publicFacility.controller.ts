import { Request, Response } from "express";
import { PublicFacilityService } from "./publicFacility.service";
import { StatusCodes } from "http-status-codes";


export class PublicFacilityController {
    static async search(req: Request, res: Response) {
        const results = await PublicFacilityService.search(req.query);

        res.status(StatusCodes.OK).json({
            count: results.length,
            data: results,
        });
    }
}