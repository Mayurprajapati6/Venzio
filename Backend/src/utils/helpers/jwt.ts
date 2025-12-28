import jwt, { JwtPayload as JwtLibPayload, SignOptions } from "jsonwebtoken";
import { serverConfig } from "../../config";


const ACCESS_SECRET = serverConfig.JWT_SECRET!;
const REFRESH_SECRET = serverConfig.JWT_REFRESH_SECRET!;


const ACCESS_EXPIRES_IN: SignOptions["expiresIn"] =
  serverConfig.JWT_ACCESS_SECRET_EXPIRES_IN as SignOptions["expiresIn"];

const REFRESH_EXPIRES_IN: SignOptions["expiresIn"] =
  serverConfig.JWT_REFRESH_SECRET_EXPIRES_IN as SignOptions["expiresIn"];

export interface JwtPayload {
  userId: string;
  role: "ADMIN" | "OWNER" | "USER";
}


export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN
  });                     
}

export function verifyAccessToken(token: string): JwtPayload {
  return verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token: string): JwtPayload {
  return verify(token, REFRESH_SECRET);
}

function verify(token: string, secret: string): JwtPayload {
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === "string") throw new Error("Invalid token");

  const payload = decoded as JwtLibPayload & JwtPayload;
  if (!payload.userId || !payload.role) {
    throw new Error("Invalid token payload");
  }

  return { userId: payload.userId, role: payload.role };
}