"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  ActionResult,
  CategoryOption,
  CategoryWithCount,
} from "@/types/category";

const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Nama kategori wajib diisi")
    .max(100, "Nama kategori maksimal 100 karakter")
    .trim(),
});

const requireOwner = async () => {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== "OWNER") return null;
  return session;
};

const revalidate = () => {
  revalidatePath("/dashboard/category");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/pos");
};

export const getCategories = async (): Promise<CategoryWithCount[]> => {
  const session = await getSession();
  if (!session) return [];

  return prisma.category.findMany({
    where: { storeId: session.storeId },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
};

export const getCategoryOptions = async (): Promise<CategoryOption[]> => {
  const session = await getSession();
  if (!session) return [];

  return prisma.category.findMany({
    where: { storeId: session.storeId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
};

export const createCategory = async (
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> => {
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
};

export const updateCategory = async (
  _prevState: ActionResult | null,
  categoryId: string,
  formData: FormData,
): Promise<ActionResult> => {
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

  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId: session.storeId },
  });
  if (!category) {
    return { success: false, message: "Kategori tidak ditemukan" };
  }

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
};

export const deleteCategory = async (
  categoryId: string,
): Promise<ActionResult> => {
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
};
