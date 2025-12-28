import { db } from "../../db";
import { refreshTokens, users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export class AuthRepository {

  static async createUser(data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: "ADMIN" | "OWNER" | "USER";
  }) {
    const user = {
      id: randomUUID(),
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
      role: data.role,
    };

    await db.insert(users).values(user);

    return user;
  }

  static async findByEmail(email: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  // refresh token
  
  static async saveRefreshToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }) {
    await db.insert(refreshTokens).values({
      id: randomUUID(),
      ...data,
    });
  }

  static async findRefreshToken(token: string) {
    const result = await db.select().from(refreshTokens)
      .where(eq(refreshTokens.token, token))
      .limit(1);
    return result[0] ?? null;
  }

  static async revokeRefreshToken(token: string) {
    await db.update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.token, token));
  }
}


