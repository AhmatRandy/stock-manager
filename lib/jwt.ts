import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export const JWT_EXPIRES_IN_SECONDS = 1800;

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  storeId: string;
  iat?: number;
  exp?: number;
}

export function signJwt(payload: Omit<JwtPayload, "iat" | "exp">) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN_SECONDS,
  });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
