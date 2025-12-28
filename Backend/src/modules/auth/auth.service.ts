import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { AuthRepository } from "./auth.repository";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/helpers/jwt";
import { ConflictError, UnauthorizedError } from "../../utils/errors/app.error";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export class AuthService {

  static async signup(data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: "ADMIN" | "OWNER" | "USER";
  }) {
    const existing = await AuthRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError("User already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await AuthRepository.createUser({
      ...data,
      password: hashedPassword,
    });

    return this.issueTokens(user.id, user.role, user);
  }

  static async login(email: string, password: string) {
    const user = await AuthRepository.findByEmail(email);
    if(!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const match = await bcrypt.compare(password, user.password);
    if(!match) {
      throw new UnauthorizedError("Invalid credentials");
    }

    return this.issueTokens(user.id, user.role, user);
  }

  private static async issueTokens(
    userId: string,
    role: "ADMIN" | "OWNER" | "USER",
    user: any
  ) {
    const accessToken = signAccessToken({ userId, role });
    const refreshToken = signRefreshToken({ userId, role });

    await AuthRepository.saveRefreshToken({
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const { password, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser };
  }

  
  static async refresh(refreshToken: string) {
    const stored = await AuthRepository.findRefreshToken(refreshToken);
    if (!stored || stored.revoked) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const payload = verifyRefreshToken(refreshToken);

    await AuthRepository.revokeRefreshToken(refreshToken);

    const newAccess = signAccessToken(payload);
    const newRefresh = signRefreshToken(payload);

    await AuthRepository.saveRefreshToken({
      userId: payload.userId,
      token: newRefresh,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken: newAccess, refreshToken: newRefresh };
  }

 
  static async logout(refreshToken: string) {
    await AuthRepository.revokeRefreshToken(refreshToken);
  }

  
  static async forgotPassword(email: string) {
    const user = await AuthRepository.findByEmail(email);
    if (!user) return;

    const token = randomUUID();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await db.update(users)
      .set({ resetToken: token, resetTokenExpiry: expiry })
      .where(eq(users.id, user.id));

    // send email with reset link
  }

  
  static async resetPassword(token: string, newPassword: string) {
    const result = await db.select().from(users)
      .where(eq(users.resetToken, token))
      .limit(1);

    const user = result[0];
    if (!user || user.resetTokenExpiry! < new Date()) {
      throw new UnauthorizedError("Token expired");
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.update(users)
      .set({
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .where(eq(users.id, user.id));
  }

}
