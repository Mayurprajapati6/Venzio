import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/role.middleware";
import { CategoryController } from "./category.controller";
import { validateRequestBody } from "../../validators";
import { createCategorySchema } from "../../validators/category.validator";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  validateRequestBody(createCategorySchema),
  CategoryController.create
);

router.get("/", CategoryController.list);

export default router;
