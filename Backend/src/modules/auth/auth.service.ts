import bcrypt from "bcryptjs";
import { AuthRepository } from "./auth.repository";
import { signToken } from "../../utils/jwt";
import { ConflictError, UnauthorizedError } from "../../utils/errors/app.error";

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

    const token = signToken({
      userId: user.id,
      role: user.role,
    });

    const { password: _password, ...safeUser } = user;

    return { token, user: safeUser };
  }

  static async login(email: string, password: string) {
    const user = await AuthRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
    });

    const { password: _password, ...safeUser } = user;

    return { token, user: safeUser };
  }
}
