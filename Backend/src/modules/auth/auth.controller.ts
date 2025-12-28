import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthService } from "./auth.service";

export class AuthController {

  static async signup(req: Request, res: Response) {
    const result = await AuthService.signup(req.body);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  }

  static async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  }

  static async refresh(req: Request, res: Response) {
    const token = req.cookies?.refreshToken;
    const result = await AuthService.refresh(token);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return res.json({ accessToken: result.accessToken });
  }

  static async logout(req: Request, res: Response) {
    const token = req.cookies?.refreshToken;
    await AuthService.logout(token);

    res.clearCookie("refreshToken");
    return res.json({ success: true });
  }

  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body.email;
    await AuthService.forgotPassword(email);
    return res.json({ success: true });
  }

  static async resetPassword(req: Request, res: Response) {
    const { token, password} = req.body;
    await AuthService.resetPassword(token, password);
    return res.json({ success: true });
  }
}
