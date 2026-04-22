"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { toScaled, fromScaled } from "@/lib/stock";
import { ProductWithVariants, QuantityType } from "@/types/product";

export type ActionResult = {
  success: boolean;
  message?: string;
  data?: any;
};

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama varian harus diisi"),
  unit: z.string().min(1).default("pcs"),
  price: z.number().int().min(0, "Harga tidak boleh negatif"),
  stock: z.number().min(0, "Stok tidak boleh negatif"),
  quantityType: z.enum(["discrete", "continuous"]).default("discrete"),
  step: z.number().positive("Step harus lebih dari 0").default(1),
  minOrder: z.number().positive("Minimum order harus lebih dari 0").default(1),
});

const productSchema = z.object({
  name: z.string().min(1, "Nama produk harus diisi"),
  categoryId: z.string().optional().nullable(),
  variants: z
    .array(variantSchema)
    .min(1, "Produk harus memiliki minimal 1 varian"),
});

export type ProductFormData = z.infer<typeof productSchema>;

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

export const getProducts = async (): Promise<ProductWithVariants[]> => {
  const session = await getSession();
  if (!session) return [];

  const rows = await prisma.product.findMany({
    where: { storeId: session.storeId },
    select: {
      id: true,
      name: true,
      storeId: true,
      categoryId: true,
      createdAt: true,
      category: { select: { id: true, name: true } },

      variants: {
        orderBy: { createdAt: "asc" },
        take: 5,
        select: {
          id: true,
          productId: true,
          name: true,
          unit: true,
          price: true,
          stock: true,
          quantityType: true,
          step: true,
          minOrder: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rows.map((p) => ({
    ...p,
    variants: p.variants.map((v) => ({
      ...v,
      stock: fromScaled(v.stock),
      step: fromScaled(v.step),
      minOrder: fromScaled(v.minOrder),
      quantityType: v.quantityType as QuantityType,
    })),
  }));
};

export const createProduct = async (
  prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> => {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Sesi habis, silakan login ulang" };
    }

    const name = getFormValue(formData, "name");
    const rawCategoryId = getFormValue(formData, "categoryId");
    const categoryId =
      rawCategoryId &&
      typeof rawCategoryId === "string" &&
      rawCategoryId.trim() !== ""
        ? rawCategoryId.trim()
        : null;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return { success: false, message: "Nama produk harus diisi" };
    }

    const variants: Array<{
      name: string;
      price: number;
      unit: string;
      stock: number;
      quantityType: string;
      step: number;
      minOrder: number;
    }> = [];

    let index = 0;

    while (getFormValue(formData, `variants[${index}].name`)) {
      const variantName = getFormValue(formData, `variants[${index}].name`);
      const variantPrice = getFormValue(formData, `variants[${index}].price`);
      const variantStock = getFormValue(formData, `variants[${index}].stock`);
      const variantUnit = getFormValue(formData, `variants[${index}].unit`);
      const variantQtyType =
        getFormValue(formData, `variants[${index}].quantityType`) ?? "discrete";
      const variantStep =
        getFormValue(formData, `variants[${index}].step`) ?? "1";
      const variantMinOrder =
        getFormValue(formData, `variants[${index}].minOrder`) ?? "1";

      if (
        !variantName ||
        typeof variantName !== "string" ||
        variantName.trim() === ""
      ) {
        index++;
        continue;
      }

      const price = Number(variantPrice);
      const stock = Number(variantStock);
      const step = Number(variantStep);
      const minOrder = Number(variantMinOrder);

      if (isNaN(price) || isNaN(stock) || isNaN(step) || isNaN(minOrder)) {
        return {
          success: false,
          message: `Varian ${index + 1}: Harga, stok, step, dan minimum order harus berupa angka`,
        };
      }

      variants.push({
        name: variantName.trim(),
        unit: String(variantUnit ?? "pcs").trim() || "pcs",
        price: Math.round(price),
        stock,
        quantityType: String(variantQtyType),
        step,
        minOrder,
      });

      index++;
    }

    if (variants.length === 0) {
      return {
        success: false,
        message: "Produk harus memiliki minimal 1 varian",
      };
    }

    const parsed = productSchema.safeParse({
      name: name.trim(),
      categoryId,
      variants,
    });

    if (!parsed.success) {
      const errors = parsed.error.issues
        .map((issue) => {
          const path = issue.path.join(".");
          return `${path}: ${issue.message}`;
        })
        .join(", ");

      return {
        success: false,
        message: `Validasi gagal: ${errors}`,
      };
    }

    const validatedData = parsed.data;

    const variantNames = validatedData.variants.map((v) =>
      v.name.toLowerCase(),
    );
    const duplicateVariants = variantNames.filter(
      (name, index) => variantNames.indexOf(name) !== index,
    );

    if (duplicateVariants.length > 0) {
      return {
        success: false,
        message: `Nama varian tidak boleh duplikat: ${duplicateVariants.join(", ")}`,
      };
    }

    // Check duplicate using case-insensitive query at DB level
    const existing = await prisma.product.findFirst({
      where: {
        storeId: session.storeId,
        name: { equals: validatedData.name, mode: "insensitive" },
      },
      select: { id: true, name: true },
    });

    if (existing) {
      return {
        success: false,
        message: `Produk dengan nama "${validatedData.name}" sudah ada`,
      };
    }
    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: validatedData.name,
          storeId: session.storeId,
          categoryId: validatedData.categoryId ?? null,
          variants: {
            create: validatedData.variants.map((v) => ({
              name: v.name,
              unit: v.unit,
              price: v.price,
              stock: toScaled(v.stock),
              quantityType: v.quantityType,
              step: toScaled(v.step),
              minOrder: toScaled(v.minOrder),
            })),
          },
        },
        include: {
          variants: true,
        },
      });

      return product;
    });

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/pos");

    return {
      success: true,
      message: `Produk "${validatedData.name}" berhasil ditambahkan dengan ${newProduct.variants.length} varian`,
      data: newProduct,
    };
  } catch (error) {
    if (
      error &&
      typeof (error as any).code === "string" &&
      (error as any).code === "P2002"
    ) {
      return {
        success: false,
        message: "Produk dengan nama ini sudah ada",
      };
    }

    if (error instanceof Error) {
      if (error.message.includes("Invalid")) {
        return {
          success: false,
          message: `Data tidak valid: ${error.message}`,
        };
      }

      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }

    return {
      success: false,
      message: "Terjadi kesalahan saat menambahkan produk. Silakan coba lagi.",
    };
  }
};

export const updateProduct = async (
  prevState: ActionResult | null,
  productId: string,
  formData: FormData,
): Promise<ActionResult> => {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Sesi habis, silakan login ulang" };
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: session.storeId },
      include: { variants: true },
    });

    if (!product) {
      return { success: false, message: "Produk tidak ditemukan" };
    }

    const name = getFormValue(formData, "name") as string;
    const rawCategoryId = getFormValue(formData, "categoryId");
    const categoryId =
      rawCategoryId &&
      typeof rawCategoryId === "string" &&
      rawCategoryId.trim() !== ""
        ? rawCategoryId.trim()
        : null;
    const variants: any[] = [];
    let index = 0;

    while (getFormValue(formData, `variants[${index}].name`)) {
      const variant: any = {
        name: getFormValue(formData, `variants[${index}].name`) as string,
        unit:
          String(
            getFormValue(formData, `variants[${index}].unit`) ?? "pcs",
          ).trim() || "pcs",
        price: Number(getFormValue(formData, `variants[${index}].price`)),
        stock: Number(getFormValue(formData, `variants[${index}].stock`)),
        quantityType: String(
          getFormValue(formData, `variants[${index}].quantityType`) ??
            "discrete",
        ),
        step: Number(getFormValue(formData, `variants[${index}].step`) ?? "1"),
        minOrder: Number(
          getFormValue(formData, `variants[${index}].minOrder`) ?? "1",
        ),
      };
      const variantId = getFormValue(formData, `variants[${index}].id`);
      if (variantId) {
        variant.id = variantId as string;
      }
      variants.push(variant);
      index++;
    }

    // Validate dengan Zod
    const parsed = productSchema.safeParse({ name, categoryId, variants });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
      return { success: false, message: firstError };
    }

    const validatedData = parsed.data;

    const existingVariantIds = validatedData.variants
      .filter((v) => v.id)
      .map((v) => v.id as string);
    const variantsToDelete = product.variants.filter(
      (v) => !existingVariantIds.includes(v.id),
    );

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name: validatedData.name,
          categoryId: validatedData.categoryId ?? null,
        },
      });

      if (variantsToDelete.length > 0) {
        await tx.productVariant.deleteMany({
          where: {
            id: { in: variantsToDelete.map((v) => v.id) },
          },
        });
      }

      for (const variant of validatedData.variants) {
        if (variant.id) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              name: variant.name,
              unit: variant.unit,
              price: variant.price,
              stock: toScaled(variant.stock),
              quantityType: variant.quantityType,
              step: toScaled(variant.step),
              minOrder: toScaled(variant.minOrder),
            },
          });
        } else {
          // Create new
          await tx.productVariant.create({
            data: {
              productId,
              name: variant.name,
              unit: variant.unit,
              price: variant.price,
              stock: toScaled(variant.stock),
              quantityType: variant.quantityType,
              step: toScaled(variant.step),
              minOrder: toScaled(variant.minOrder),
            },
          });
        }
      }
    });

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/pos");

    return {
      success: true,
      message: `Produk "${validatedData.name}" berhasil diupdate`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Terjadi kesalahan saat mengupdate produk",
    };
  }
};

export const deleteProduct = async (
  productId: string,
): Promise<ActionResult> => {
  try {
    // Auth
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Sesi habis, silakan login ulang" };
    }

    // Verify ownership
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: session.storeId },
    });

    if (!product) {
      return { success: false, message: "Produk tidak ditemukan" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({
        where: { productId },
      });

      await tx.product.delete({
        where: { id: productId },
      });
    });

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/pos");

    return {
      success: true,
      message: `Produk "${product.name}" berhasil dihapus`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus produk",
    };
  }
};

export const updateVariantStock = async (
  variantId: string,
  newStock: number,
): Promise<ActionResult> => {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Sesi habis, silakan login ulang" };
    }

    if (newStock < 0) {
      return { success: false, message: "Stok tidak boleh negatif" };
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || variant.product.storeId !== session.storeId) {
      return { success: false, message: "Varian tidak ditemukan" };
    }

    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: toScaled(newStock) },
    });

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/pos");

    return { success: true, message: "Stok berhasil diupdate" };
  } catch (error) {
    return {
      success: false,
      message: "Terjadi kesalahan saat mengupdate stok",
    };
  }
};
