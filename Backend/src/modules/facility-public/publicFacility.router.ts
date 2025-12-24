import express from "express";
import { PublicFacilityController } from "./publicFacility.controller";

const router = express.Router();

/**
 * PUBLIC SEARCH
 * GET /api/v1/public/facilities/search
 */
router.get("/search", PublicFacilityController.search);

export default router;
