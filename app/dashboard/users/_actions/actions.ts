"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/user";
import { ACCESS, authorizeAction } from "@/lib/auth";
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

const countOtherOwners = (storeId: string, excludeUserId: string) =>
  prisma.user.count({
    where: {
      storeId,
      role: "OWNER",
      deletedAt: null,
      id: { not: excludeUserId },
    },
  });

// ── Actions ──────────────────────────────────────────────────────────────────
// Query daftar user ada di `@/server/queries/user`.

export async function createUser(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await authorizeAction(
    ACCESS.users,
    "Hanya OWNER yang dapat menambah user",
  );
  if (!auth.ok) return { success: false, message: auth.message };
  const { session } = auth;

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
    return {
      success: false,
      message: exists.deletedAt
        ? "Email sudah pernah dipakai user yang telah dihapus. Gunakan email lain."
        : "Email sudah digunakan",
    };
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
  const auth = await authorizeAction(
    ACCESS.users,
    "Hanya OWNER yang dapat mengubah user",
  );
  if (!auth.ok) return { success: false, message: auth.message };
  const { session } = auth;

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

  const target = await prisma.user.findFirst({
    where: { id: userId, storeId: session.storeId, deletedAt: null },
  });
  if (!target) {
    return { success: false, message: "User tidak ditemukan" };
  }

  if (
    target.role === "OWNER" &&
    parsed.data.role !== "OWNER" &&
    (await countOtherOwners(session.storeId, userId)) === 0
  ) {
    return {
      success: false,
      message: "Toko harus memiliki minimal 1 OWNER. Jadikan user lain OWNER terlebih dahulu.",
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name, role: parsed.data.role as $Enums.Role },
  });

  revalidatePath("/dashboard/users");
  return { success: true, message: "User berhasil diperbarui" };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const auth = await authorizeAction(
    ACCESS.users,
    "Hanya OWNER yang dapat menghapus user",
  );
  if (!auth.ok) return { success: false, message: auth.message };
  const { session } = auth;

  if (userId === session.id) {
    return {
      success: false,
      message: "Anda tidak dapat menghapus akun sendiri",
    };
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, storeId: session.storeId, deletedAt: null },
  });
  if (!target) {
    return { success: false, message: "User tidak ditemukan" };
  }

  if (
    target.role === "OWNER" &&
    (await countOtherOwners(session.storeId, userId)) === 0
  ) {
    return {
      success: false,
      message: "Toko harus memiliki minimal 1 OWNER",
    };
  }

  // Soft delete: transaksi & riwayat stok user ini tetap utuh, dan
  // getSession langsung menolak sesinya.
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/dashboard/users");
  return { success: true, message: "User berhasil dihapus" };
}
