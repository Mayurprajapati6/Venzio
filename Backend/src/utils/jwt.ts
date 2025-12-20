import jwt, { JwtPayload as JwtLibPayload, SignOptions } from "jsonwebtoken";
import { serverConfig } from "../config";

const JWT_SECRET: string = serverConfig.JWT_SECRET as string;


const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
  serverConfig.JWT_EXPIRES_IN as SignOptions["expiresIn"];

export interface JwtPayload {
  userId: string;
  role: "ADMIN" | "OWNER" | "USER";
}


export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}


export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  const payload = decoded as JwtLibPayload & JwtPayload;

  if (!payload.userId || !payload.role) {
    throw new Error("Invalid token structure");
  }

  return {
    userId: payload.userId,
    role: payload.role,
  };
}
