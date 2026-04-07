import { cookies } from "next/headers";
import { verifyJwt, type JwtPayload } from "@/lib/jwt";

/**
 * Ambil session (payload JWT) dari cookie.
 * Kembalikan null jika token tidak ada atau expired.
 */
export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
}

/**
 * Hapus semua cookie sesi.
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("token_exp");
}
