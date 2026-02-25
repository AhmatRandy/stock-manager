"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ProductWithVariants = {
  id: string;
  name: string;
  createdAt: Date;
  variants: {
    id: string;
    name: string;
    price: number;
    stock: number;
  }[];
};

export type ActionResult = {
  success: boolean;
  message?: string;
  data?: any;
};

const variantSchema = z.object({
  id: z.string().optional(), // optional untuk variant baru
  name: z.string().min(1, "Nama varian harus diisi"),
  price: z.number().int().min(0, "Harga tidak boleh negatif"),
  stock: z.number().int().min(0, "Stok tidak boleh negatif"),
});

const productSchema = z.object({
  name: z.string().min(1, "Nama produk harus diisi"),
  variants: z
    .array(variantSchema)
    .min(1, "Produk harus memiliki minimal 1 varian"),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ─── Helper Functions ─────────────────────────────────────────────────────────

// Helper function to get FormData value with or without useActionState prefix
function getFormValue(
  formData: FormData,
  key: string,
): FormDataEntryValue | null {
  // First try direct key
  if (formData.has(key)) {
    return formData.get(key);
  }

  // Try with prefix pattern (e.g., "1_name", "2_name", etc.)
  // useActionState adds a numeric prefix to prevent collisions
  for (const [formKey, value] of formData.entries()) {
    // Match pattern: {digits}_{key}
    const match = formKey.match(/^\d+_(.+)$/);
    if (match && match[1] === key) {
      return value;
    }
  }

  return null;
}

// ─── Get All Products ─────────────────────────────────────────────────────────

export async function getProducts(): Promise<ProductWithVariants[]> {
  const session = await getSession();
  if (!session) return [];

  const products = await prisma.product.findMany({
    where: { storeId: session.storeId },
    include: {
      variants: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return products;
}

// ─── Create Product ───────────────────────────────────────────────────────────

// ─── Create Product ───────────────────────────────────────────────────────────

export async function createProduct(
  prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // Auth
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Sesi habis, silakan login ulang" };
    }

    // Parse FormData dengan type-safe
    const name = getFormValue(formData, "name");

    // Validasi name ada dan bukan empty string
    if (!name || typeof name !== "string" || name.trim() === "") {
      return { success: false, message: "Nama produk harus diisi" };
    }

    // Parse variants dari FormData
    const variants: Array<{
      name: string;
      price: number;
      stock: number;
    }> = [];

    let index = 0;

    while (getFormValue(formData, `variants[${index}].name`)) {
      const variantName = getFormValue(formData, `variants[${index}].name`);
      const variantPrice = getFormValue(formData, `variants[${index}].price`);
      const variantStock = getFormValue(formData, `variants[${index}].stock`);

      // Skip jika variant name kosong
      if (
        !variantName ||
        typeof variantName !== "string" ||
        variantName.trim() === ""
      ) {
        index++;
        continue;
      }

      // Parse price dan stock dengan validasi
      const price = Number(variantPrice);
      const stock = Number(variantStock);

      // Validasi number parsing
      if (isNaN(price) || isNaN(stock)) {
        return {
          success: false,
          message: `Varian ${index + 1}: Harga dan stok harus berupa angka`,
        };
      }

      variants.push({
        name: variantName.trim(),
        price: Math.round(price), // Bulatkan ke integer
        stock: Math.round(stock), // Bulatkan ke integer
      });

      index++;
    }

    // Validasi minimal ada 1 variant
    if (variants.length === 0) {
      return {
        success: false,
        message: "Produk harus memiliki minimal 1 varian",
      };
    }

    // Validate dengan Zod
    const parsed = productSchema.safeParse({
      name: name.trim(),
      variants,
    });

    if (!parsed.success) {
      // Format error message yang lebih readable
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

    // Check duplicate variant names
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

    // Check if product already exists (case-insensitive for SQLite)
    const existingProducts = await prisma.product.findMany({
      where: {
        storeId: session.storeId,
      },
      select: {
        name: true,
      },
    });

    const isDuplicate = existingProducts.some(
      (p) => p.name.toLowerCase() === validatedData.name.toLowerCase(),
    );

    if (isDuplicate) {
      return {
        success: false,
        message: `Produk dengan nama "${validatedData.name}" sudah ada`,
      };
    }

    // Create product with variants dalam transaction
    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: validatedData.name,
          storeId: session.storeId,
          variants: {
            create: validatedData.variants.map((v) => ({
              name: v.name,
              price: v.price,
              stock: v.stock,
            })),
          },
        },
        include: {
          variants: true,
        },
      });

      return product;
    });

    // Revalidate paths
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/pos");

    return {
      success: true,
      message: `Produk "${validatedData.name}" berhasil ditambahkan dengan ${newProduct.variants.length} varian`,
      data: newProduct,
    };
  } catch (error) {
    console.error("Create product error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return {
          success: false,
          message: "Produk dengan nama ini sudah ada",
        };
      }

      if (error.message.includes("Invalid")) {
        return {
          success: false,
          message: `Data tidak valid: ${error.message}`,
        };
      }

      // Return the actual error message for debugging
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
}

// ─── Update Product ───────────────────────────────────────────────────────────

export async function updateProduct(
  prevState: ActionResult | null,
  productId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // Auth
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Sesi habis, silakan login ulang" };
    }

    // Verify ownership
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: session.storeId },
      include: { variants: true },
    });

    if (!product) {
      return { success: false, message: "Produk tidak ditemukan" };
    }

    // Parse variants dari FormData
    const name = getFormValue(formData, "name") as string;
    const variants: any[] = [];
    let index = 0;

    while (getFormValue(formData, `variants[${index}].name`)) {
      const variant: any = {
        name: getFormValue(formData, `variants[${index}].name`) as string,
        price: Number(getFormValue(formData, `variants[${index}].price`)),
        stock: Number(getFormValue(formData, `variants[${index}].stock`)),
      };
      const variantId = getFormValue(formData, `variants[${index}].id`);
      if (variantId) {
        variant.id = variantId as string;
      }
      variants.push(variant);
      index++;
    }

    // Validate dengan Zod
    const parsed = productSchema.safeParse({ name, variants });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
      return { success: false, message: firstError };
    }

    const validatedData = parsed.data;

    // Pisahkan variant yang sudah ada vs baru
    const existingVariantIds = validatedData.variants
      .filter((v) => v.id)
      .map((v) => v.id as string);
    const variantsToDelete = product.variants.filter(
      (v) => !existingVariantIds.includes(v.id),
    );

    // Update dalam transaction
    await prisma.$transaction(async (tx) => {
      // Update product name
      await tx.product.update({
        where: { id: productId },
        data: { name: validatedData.name },
      });

      // Delete variants yang dihapus
      if (variantsToDelete.length > 0) {
        await tx.productVariant.deleteMany({
          where: {
            id: { in: variantsToDelete.map((v) => v.id) },
          },
        });
      }

      // Update atau create variants
      for (const variant of validatedData.variants) {
        if (variant.id) {
          // Update existing
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              name: variant.name,
              price: variant.price,
              stock: variant.stock,
            },
          });
        } else {
          // Create new
          await tx.productVariant.create({
            data: {
              productId,
              name: variant.name,
              price: variant.price,
              stock: variant.stock,
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
    console.error("Update product error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat mengupdate produk",
    };
  }
}

// ─── Delete Product ───────────────────────────────────────────────────────────

export async function deleteProduct(productId: string): Promise<ActionResult> {
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
    console.error("Delete product error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus produk",
    };
  }
}

// ─── Quick Stock Update ───────────────────────────────────────────────────────

export async function updateVariantStock(
  variantId: string,
  newStock: number,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Sesi habis, silakan login ulang" };
    }

    if (newStock < 0) {
      return { success: false, message: "Stok tidak boleh negatif" };
    }

    // Verify ownership via product
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || variant.product.storeId !== session.storeId) {
      return { success: false, message: "Varian tidak ditemukan" };
    }

    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock },
    });

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/pos");

    return { success: true, message: "Stok berhasil diupdate" };
  } catch (error) {
    console.error("Update stock error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat mengupdate stok",
    };
  }
}
