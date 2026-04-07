"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CategoryWithCount = {
  id: string;
  name: string;
  createdAt: Date;
  _count: { products: number };
};

export type CategoryOption = {
  id: string;
  name: string;
};

export type ActionResult = {
  success: boolean;
  message?: string;
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Nama kategori wajib diisi")
    .max(100, "Nama kategori maksimal 100 karakter")
    .trim(),
});

// ─── Helper: periksa role OWNER ───────────────────────────────────────────────

async function requireOwner() {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== "OWNER") return null;
  return session;
}

function revalidate() {
  revalidatePath("/dashboard/category");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/pos");
}

// ─── Get All Categories (untuk list & select) ─────────────────────────────────

export async function getCategories(): Promise<CategoryWithCount[]> {
  const session = await getSession();
  if (!session) return [];

  return prisma.category.findMany({
    where: { storeId: session.storeId },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const session = await getSession();
  if (!session) return [];

  return prisma.category.findMany({
    where: { storeId: session.storeId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createCategory(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireOwner();
  if (!session) {
    return {
      success: false,
      message: "Hanya OWNER yang dapat membuat kategori",
    };
  }

  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  // Cek duplikat nama per toko
  const exists = await prisma.category.findUnique({
    where: {
      storeId_name: { storeId: session.storeId, name: parsed.data.name },
    },
  });
  if (exists) {
    return {
      success: false,
      message: `Kategori "${parsed.data.name}" sudah ada`,
    };
  }

  await prisma.category.create({
    data: { name: parsed.data.name, storeId: session.storeId },
  });

  revalidate();
  return {
    success: true,
    message: `Kategori "${parsed.data.name}" berhasil ditambahkan`,
  };
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateCategory(
  _prevState: ActionResult | null,
  categoryId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireOwner();
  if (!session) {
    return {
      success: false,
      message: "Hanya OWNER yang dapat mengubah kategori",
    };
  }

  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  // Verify ownership
  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId: session.storeId },
  });
  if (!category) {
    return { success: false, message: "Kategori tidak ditemukan" };
  }

  // Cek duplikat nama (selain dirinya sendiri)
  const duplicate = await prisma.category.findFirst({
    where: {
      storeId: session.storeId,
      name: parsed.data.name,
      id: { not: categoryId },
    },
  });
  if (duplicate) {
    return {
      success: false,
      message: `Nama "${parsed.data.name}" sudah digunakan kategori lain`,
    };
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { name: parsed.data.name },
  });

  revalidate();
  return { success: true, message: `Kategori berhasil diperbarui` };
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteCategory(
  categoryId: string,
): Promise<ActionResult> {
  const session = await requireOwner();
  if (!session) {
    return {
      success: false,
      message: "Hanya OWNER yang dapat menghapus kategori",
    };
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId: session.storeId },
    include: { _count: { select: { products: true } } },
  });
  if (!category) {
    return { success: false, message: "Kategori tidak ditemukan" };
  }

  // Lepaskan produk dari kategori ini (set categoryId = null) lalu hapus kategori
  await prisma.$transaction(async (tx) => {
    await tx.product.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    });
    await tx.category.delete({ where: { id: categoryId } });
  });

  revalidate();
  return {
    success: true,
    message: `Kategori "${category.name}" dihapus.${category._count.products > 0 ? ` ${category._count.products} produk dipindahkan ke tanpa kategori.` : ""}`,
  };
}
