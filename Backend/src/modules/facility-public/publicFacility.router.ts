import express from "express";
import { PublicFacilityController } from "./publicFacility.controller";

const router = express.Router();

router.get("/search", PublicFacilityController.search);

export default router;
