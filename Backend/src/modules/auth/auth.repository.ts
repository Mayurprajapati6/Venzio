import { db } from "../../db";
import { users } from "../../db/schema";
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
}
