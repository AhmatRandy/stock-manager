import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyJwt, type JwtPayload, type Role } from "@/lib/jwt";

export const ACCESS = {
  products: ["OWNER", "MANAGER"],
  categoryWrite: ["OWNER"],
  users: ["OWNER"],
  settings: ["OWNER"],
} as const satisfies Record<string, readonly Role[]>;

export const getSession = cache(async (): Promise<JwtPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  let payload: JwtPayload;
  try {
    payload = verifyJwt(token);
  } catch {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.id, deletedAt: null },
    select: { id: true, name: true, email: true, role: true, storeId: true },
  });
  if (!user) return null;

  return { ...user, iat: payload.iat, exp: payload.exp };
});

export const clearSession = async () => {
  const cookieStore = await cookies();

  cookieStore.delete("token");
  cookieStore.delete("token_exp");
};

export const hasRole = (session: JwtPayload, roles: readonly Role[]) =>
  roles.includes(session.role);

export async function requirePageSession(
  roles?: readonly Role[],
): Promise<JwtPayload> {
  const session = await getSession();

  if (!session) redirect("/logout");
  if (roles && !hasRole(session, roles)) notFound();
  return session;
}

export type AuthResult =
  | { ok: true; session: JwtPayload }
  | { ok: false; message: string };

export async function authorizeAction(
  roles?: readonly Role[],
  forbiddenMessage = "Anda tidak memiliki akses untuk aksi ini",
): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, message: "Sesi habis, silakan login ulang" };
  }
  if (roles && !hasRole(session, roles)) {
    return { ok: false, message: forbiddenMessage };
  }
  return { ok: true, session };
}
