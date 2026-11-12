import jwt from "jsonwebtoken";
import type { $Enums } from "@/prisma/client/client";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET belum diset di environment");
}

export const JWT_EXPIRES_IN_SECONDS = 1800;

export type Role = $Enums.Role;

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
  storeId: string;
  iat?: number;
  exp?: number;
}

export function signJwt(payload: Omit<JwtPayload, "iat" | "exp">) {
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN_SECONDS,
  });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET!) as JwtPayload;
}
