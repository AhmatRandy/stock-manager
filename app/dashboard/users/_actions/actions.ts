"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";
import type { UserRow, ActionResult } from "@/types/user";
import { getSession } from "@/lib/auth";
import { $Enums } from "@/prisma/client/client";

// ── Schemas ─────────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter")
    .trim(),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .toLowerCase(),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password terlalu panjang"),
  role: z.enum(["OWNER", "MANAGER", "CASHIER"] as const, {
    error: "Role tidak valid",
  }),
});

const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter")
    .trim(),
  role: z.enum(["OWNER", "MANAGER", "CASHIER"] as const, {
    error: "Role tidak valid",
  }),
});

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<UserRow[]> {
  const session = await getSession();
  if (!session) return [];

  return prisma.user.findMany({
    where: { storeId: session.storeId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  }) as Promise<UserRow[]>;
}

// ── Actions ──────────────────────────────────────────────────────────────────

export async function createUser(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return { success: false, message: "Hanya OWNER yang dapat menambah user" };
  }

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (exists) {
    return { success: false, message: "Email sudah digunakan" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      role: parsed.data.role as $Enums.Role,
      storeId: session.storeId,
    },
  });

  revalidatePath("/dashboard/users");
  return {
    success: true,
    message: `User ${parsed.data.name} berhasil ditambahkan`,
  };
}

export async function updateUser(
  _prevState: ActionResult | null,
  userId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return { success: false, message: "Hanya OWNER yang dapat mengubah user" };
  }

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  // Pastikan user milik store yang sama
  const target = await prisma.user.findFirst({
    where: { id: userId, storeId: session.storeId },
  });
  if (!target) {
    return { success: false, message: "User tidak ditemukan" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name, role: parsed.data.role as $Enums.Role },
  });

  revalidatePath("/dashboard/users");
  return { success: true, message: "User berhasil diperbarui" };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return { success: false, message: "Hanya OWNER yang dapat menghapus user" };
  }

  if (userId === session.id) {
    return {
      success: false,
      message: "Anda tidak dapat menghapus akun sendiri",
    };
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, storeId: session.storeId },
  });
  if (!target) {
    return { success: false, message: "User tidak ditemukan" };
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/dashboard/users");
  return { success: true, message: "User berhasil dihapus" };
}
