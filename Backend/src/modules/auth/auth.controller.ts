import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthService } from "./auth.service";
import { AppError } from "../../utils/errors/app.error";

export class AuthController {

  static async signup(req: Request, res: Response) {
    try {
      const result = await AuthService.signup(req.body);

      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: result,
      });

    } catch (err: unknown) {

      console.log("signup err", err);
      if (AuthController.isAppError(err)) {
        return res.status(err.statusCode).json({
          success: false,
          error: err.name,      
          message: err.message,
        });
      }

      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "InternalServerError",
        message: "Something went wrong",
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      return res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });

    } catch (err: unknown) {

      if (AuthController.isAppError(err)) {
        return res.status(err.statusCode).json({
          success: false,
          error: err.name,
          message: err.message,
        });
      }

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "InternalServerError",
        message: "Something went wrong",
      });
    }
  }

  
  private static isAppError(error: unknown): error is AppError {
    return (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      "message" in error
    );
  }
}
