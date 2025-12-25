import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export function appErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status =
    typeof err?.statusCode === "number"
      ? err.statusCode
      : StatusCodes.INTERNAL_SERVER_ERROR;

  res.status(status).json({
    success: false,
    error: err.name ?? "InternalServerError",
    message: err.message ?? "Something went wrong",
  });
}

export const genericErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.log(err);

    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
}