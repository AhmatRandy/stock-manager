"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ACCESS, authorizeAction } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { fromScaled, toScaled } from "@/lib/stock";
import { applyStockDelta, recordInitialStock, StockError } from "@/server/stock";

const FORBIDDEN_MESSAGE = "Hanya OWNER atau MANAGER yang dapat mengelola produk";

export type ActionResult = {
  success: boolean;
  message?: string;
  data?: unknown;
};

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Nama varian harus diisi"),
  unit: z.string().trim().min(1).default("pcs"),
  price: z.number().int().min(0, "Harga tidak boleh negatif"),
  stock: z.number().min(0, "Stok tidak boleh negatif"),
  quantityType: z.enum(["discrete", "continuous"]).default("discrete"),
  step: z.number().positive("Step harus lebih dari 0").default(1),
  minOrder: z.number().positive("Minimum order harus lebih dari 0").default(1),
});

const productSchema = z.object({
  name: z.string().trim().min(1, "Nama produk harus diisi"),
  categoryId: z.string().nullable(),
  variants: z
    .array(variantSchema)
    .min(1, "Produk harus memiliki minimal 1 varian"),
});

export type ProductFormData = z.infer<typeof productSchema>;

const revalidate = () => {
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/pos");
};

const getFormValue = (
  formData: FormData,
  key: string,
): FormDataEntryValue | null => {
  if (formData.has(key)) {
    return formData.get(key);
  }

  for (const [formKey, value] of formData.entries()) {
    const match = formKey.match(/^\d+_(.+)$/);
    if (match && match[1] === key) {
      return value;
    }
  }

  return null;
};

const getFormString = (formData: FormData, key: string) => {
  const value = getFormValue(formData, key);
  return typeof value === "string" ? value.trim() : "";
};

type ParsedForm =
  | { ok: true; data: ProductFormData; deletedVariantIds: string[] }
  | { ok: false; message: string };

const parseProductForm = (formData: FormData): ParsedForm => {
  const variants = [];
  for (let i = 0; getFormString(formData, `variants[${i}].name`); i++) {
    const field = (key: string) => getFormString(formData, `variants[${i}].${key}`);
    variants.push({
      id: field("id") || undefined,
      name: field("name"),
      unit: field("unit") || "pcs",
      price: Number(field("price")),
      // Stok varian lama tidak dikirim (input disabled); diubah lewat
      // adjustVariantStock supaya tidak menimpa penjualan yang terjadi.
      stock: Number(field("stock") || 0),
      quantityType: field("quantityType") || "discrete",
      step: Number(field("step") || 1),
      minOrder: Number(field("minOrder") || 1),
    });
  }

  const parsed = productSchema.safeParse({
    name: getFormString(formData, "name"),
    categoryId: getFormString(formData, "categoryId") || null,
    variants,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  const names = parsed.data.variants.map((v) => v.name.toLowerCase());
  const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
  if (duplicates.length > 0) {
    return {
      ok: false,
      message: `Nama varian tidak boleh duplikat: ${[...new Set(duplicates)].join(", ")}`,
    };
  }

  const deletedVariantIds = getFormString(formData, "deletedVariantIds")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return { ok: true, data: parsed.data, deletedVariantIds };
};

const isCategoryInStore = async (categoryId: string | null, storeId: string) => {
  if (!categoryId) return true;
  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
    select: { id: true },
  });
  return category !== null;
};

const isProductNameTaken = async (
  storeId: string,
  name: string,
  excludeProductId?: string,
) => {
  const existing = await prisma.product.findFirst({
    where: {
      storeId,
      deletedAt: null,
      name: { equals: name, mode: "insensitive" },
      ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
    },
    select: { id: true },
  });
  return existing !== null;
};

const toVariantData = (v: ProductFormData["variants"][number]) => ({
  name: v.name,
  unit: v.unit,
  price: v.price,
  quantityType: v.quantityType,
  step: toScaled(v.step),
  minOrder: toScaled(v.minOrder),
});

export const createProduct = async (
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> => {
  const auth = await authorizeAction(ACCESS.products, FORBIDDEN_MESSAGE);
  if (!auth.ok) return { success: false, message: auth.message };
  const { session } = auth;

  const form = parseProductForm(formData);
  if (!form.ok) return { success: false, message: form.message };
  const { data } = form;

  if (!(await isCategoryInStore(data.categoryId, session.storeId))) {
    return { success: false, message: "Kategori tidak ditemukan" };
  }
  if (await isProductNameTaken(session.storeId, data.name)) {
    return {
      success: false,
      message: `Produk dengan nama "${data.name}" sudah ada`,
    };
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          storeId: session.storeId,
          categoryId: data.categoryId,
          variants: {
            create: data.variants.map((v) => ({
              ...toVariantData(v),
              stock: toScaled(v.stock),
            })),
          },
        },
        select: { id: true, variants: { select: { id: true, stock: true } } },
      });
      await recordInitialStock(tx, session.storeId, session.id, product.variants);
      return product;
    });

    revalidate();
    return {
      success: true,
      message: `Produk "${data.name}" berhasil ditambahkan dengan ${product.variants.length} varian`,
    };
  } catch (error) {
    console.error("createProduct gagal:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menambahkan produk. Silakan coba lagi.",
    };
  }
};

export const updateProduct = async (
  _prevState: ActionResult | null,
  productId: string,
  formData: FormData,
): Promise<ActionResult> => {
  const auth = await authorizeAction(ACCESS.products, FORBIDDEN_MESSAGE);
  if (!auth.ok) return { success: false, message: auth.message };
  const { session } = auth;

  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: session.storeId, deletedAt: null },
    select: { id: true, variants: { where: { deletedAt: null }, select: { id: true } } },
  });
  if (!product) {
    return { success: false, message: "Produk tidak ditemukan" };
  }

  const form = parseProductForm(formData);
  if (!form.ok) return { success: false, message: form.message };
  const { data } = form;

  if (!(await isCategoryInStore(data.categoryId, session.storeId))) {
    return { success: false, message: "Kategori tidak ditemukan" };
  }
  if (await isProductNameTaken(session.storeId, data.name, productId)) {
    return {
      success: false,
      message: `Produk dengan nama "${data.name}" sudah ada`,
    };
  }

  // ID varian datang dari form: tolak ID yang bukan milik produk ini.
  const ownVariantIds = new Set(product.variants.map((v) => v.id));
  const submittedIds = data.variants.flatMap((v) => (v.id ? [v.id] : []));
  if (submittedIds.some((id) => !ownVariantIds.has(id))) {
    return { success: false, message: "Varian tidak ditemukan" };
  }

  // Hanya hapus varian yang memang dihapus user di form. Varian yang tidak
  // ikut terkirim dibiarkan apa adanya, supaya tidak ada data yang hilang.
  const deleteIds = form.deletedVariantIds.filter(
    (id) => ownVariantIds.has(id) && !submittedIds.includes(id),
  );

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: { name: data.name, categoryId: data.categoryId },
      });

      if (deleteIds.length > 0) {
        await tx.productVariant.updateMany({
          where: { id: { in: deleteIds }, productId },
          data: { deletedAt: new Date() },
        });
      }

      const created: { id: string; stock: number }[] = [];
      for (const variant of data.variants) {
        if (variant.id) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: toVariantData(variant),
          });
        } else {
          created.push(
            await tx.productVariant.create({
              data: {
                ...toVariantData(variant),
                productId,
                stock: toScaled(variant.stock),
              },
              select: { id: true, stock: true },
            }),
          );
        }
      }
      await recordInitialStock(tx, session.storeId, session.id, created);
    });

    revalidate();
    return {
      success: true,
      message: `Produk "${data.name}" berhasil diupdate`,
    };
  } catch (error) {
    console.error("updateProduct gagal:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat mengupdate produk",
    };
  }
};

export const deleteProduct = async (
  productId: string,
): Promise<ActionResult> => {
  const auth = await authorizeAction(ACCESS.products, FORBIDDEN_MESSAGE);
  if (!auth.ok) return { success: false, message: auth.message };
  const { session } = auth;

  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: session.storeId, deletedAt: null },
    select: { name: true },
  });
  if (!product) {
    return { success: false, message: "Produk tidak ditemukan" };
  }

  try {
    const deletedAt = new Date();
    await prisma.$transaction([
      prisma.productVariant.updateMany({
        where: { productId, deletedAt: null },
        data: { deletedAt },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { deletedAt },
      }),
    ]);

    revalidate();
    return {
      success: true,
      message: `Produk "${product.name}" berhasil dihapus`,
    };
  } catch (error) {
    console.error("deleteProduct gagal:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus produk",
    };
  }
};

/** Tambah/kurangi stok (delta dalam satuan tampilan, mis. +1 atau -0.5). */
export const adjustVariantStock = async (
  variantId: string,
  delta: number,
): Promise<ActionResult> => {
  const auth = await authorizeAction(ACCESS.products, FORBIDDEN_MESSAGE);
  if (!auth.ok) return { success: false, message: auth.message };
  const { session } = auth;

  const scaledDelta = toScaled(delta);
  if (!Number.isFinite(scaledDelta) || scaledDelta === 0) {
    return { success: false, message: "Jumlah perubahan stok tidak valid" };
  }

  try {
    const stockAfter = await prisma.$transaction((tx) =>
      applyStockDelta(tx, {
        storeId: session.storeId,
        variantId,
        delta: scaledDelta,
        type: "ADJUSTMENT",
        userId: session.id,
        note: "Penyesuaian manual",
      }),
    );

    revalidate();
    return {
      success: true,
      message: "Stok berhasil diupdate",
      data: { stock: fromScaled(stockAfter) },
    };
  } catch (error) {
    if (error instanceof StockError) {
      return {
        success: false,
        message:
          error.code === "INSUFFICIENT"
            ? "Stok tidak boleh kurang dari 0"
            : "Varian tidak ditemukan",
      };
    }
    console.error("adjustVariantStock gagal:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat mengupdate stok",
    };
  }
};
