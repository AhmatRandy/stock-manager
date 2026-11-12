"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signJwt, JWT_EXPIRES_IN_SECONDS } from "@/lib/jwt";

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

  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as LoginState["errors"],
    };
  }

  const { email, password } = result.data;

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (e: any) {
    return {
      success: false,
      message:
        "Terjadi kesalahan pada server saat mencoba login. Cek log server.",
    };
  }
  if (!user || user.deletedAt) {
    return {
      success: false,
      message: "Email atau password salah",
    };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return {
      success: false,
      message: "Email atau password salah",
    };
  }

  const token = signJwt({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
  });

  const expTimestamp = Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN_SECONDS;

  const cookieStore = await cookies();

  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: JWT_EXPIRES_IN_SECONDS,
  });

  cookieStore.set("token_exp", String(expTimestamp), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: JWT_EXPIRES_IN_SECONDS,
  });

  redirect("/dashboard");
}
