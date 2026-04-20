import { cookies } from "next/headers";
import { verifyJwt, type JwtPayload } from "@/lib/jwt";

export const getSession = async (): Promise<JwtPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
};

export const clearSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("token_exp");
};
