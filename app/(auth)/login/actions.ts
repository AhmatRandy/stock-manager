"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signJwt, JWT_EXPIRES_IN_SECONDS } from "@/lib/jwt";

// ─── Skema Validasi ───────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(6, "Password minimal 6 karakter"),
});

// ─── Tipe State ───────────────────────────────────────────────────────────────

export type LoginState = {
  success: boolean;
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
  };
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validasi Zod
  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as LoginState["errors"],
    };
  }

  const { email, password } = result.data;

  // Cek user di database
  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (e) {
    // Log detail error di server agar bisa didiagnosis
    // eslint-disable-next-line no-console
    console.error("[login] Prisma error while finding user:", e);
    return {
      success: false,
      message: "Terjadi kesalahan pada server saat mencoba login. Cek log server.",
    };
  }
  if (!user) {
    return {
      success: false,
      message: "Email atau password salah",
    };
  }

  // Verifikasi password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return {
      success: false,
      message: "Email atau password salah",
    };
  }

  // Buat token JWT
  const token = signJwt({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
  });

  const expTimestamp = Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN_SECONDS;

  const cookieStore = await cookies();

  // Cookie httpOnly untuk keamanan (tidak bisa dibaca JS)
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: JWT_EXPIRES_IN_SECONDS,
  });

  // Cookie non-httpOnly agar client bisa membaca waktu expiry untuk auto-logout
  cookieStore.set("token_exp", String(expTimestamp), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: JWT_EXPIRES_IN_SECONDS,
  });

  redirect("/dashboard");
}
