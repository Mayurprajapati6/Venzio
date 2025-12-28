import express from "express";
import { AuthController } from "./auth.controller";
import { validateRequestBody } from "../../validators";
import { loginSchema, signupSchema } from "../../validators/auth.validator";

const router = express.Router();

router.post("/signup", validateRequestBody(signupSchema), AuthController.signup);
router.post("/login", validateRequestBody(loginSchema), AuthController.login);

router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);

router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

export default router;
