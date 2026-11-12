import "server-only";
import { prisma } from "@/lib/prisma";
import { fromScaled } from "@/lib/stock";
import type { Prisma } from "@/prisma/client/client";
import type { ProductWithVariants, QuantityType } from "@/types/product";

const toDisplayVariant = <
  T extends { stock: number; step: number; minOrder: number; quantityType: string },
>(
  v: T,
) => ({
  ...v,
  stock: fromScaled(v.stock),
  step: fromScaled(v.step),
  minOrder: fromScaled(v.minOrder),
  quantityType: v.quantityType as QuantityType,
});

/**
 * Semua produk aktif beserta SEMUA varian aktifnya. Pagination & pencarian
 * dilakukan di tabel client. Form edit memakai data ini, jadi varian tidak
 * boleh dipotong (bisa menyebabkan varian terhapus saat disimpan).
 */
export const getProducts = async (
  storeId: string,
): Promise<ProductWithVariants[]> => {
  const rows = await prisma.product.findMany({
    where: { storeId, deletedAt: null },
    select: {
      id: true,
      name: true,
      categoryId: true,
      createdAt: true,
      category: { select: { id: true, name: true } },
      variants: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          unit: true,
          price: true,
          stock: true,
          quantityType: true,
          step: true,
          minOrder: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((p) => ({ ...p, variants: p.variants.map(toDisplayVariant) }));
};

export async function getPosProducts(
  storeId: string,
  options?: { take?: number; page?: number; search?: string },
) {
  const take = options?.take ?? 100;
  const page = options?.page && options.page > 0 ? options.page : 1;
  const skip = (page - 1) * take;
  const search = options?.search?.trim();

  const where: Prisma.ProductWhereInput = {
    storeId,
    deletedAt: null,
    variants: { some: { deletedAt: null } },
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            {
              variants: {
                some: {
                  deletedAt: null,
                  name: { contains: search, mode: "insensitive" },
                },
              },
            },
          ],
        }
      : {}),
  };

  const rows = await prisma.product.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
      variants: { where: { deletedAt: null }, orderBy: { price: "asc" } },
    },
    orderBy: { name: "asc" },
    skip,
    take,
  });

  return rows.map((p) => ({ ...p, variants: p.variants.map(toDisplayVariant) }));
}

export async function getStockHistory(
  storeId: string,
  productId: string,
  options?: { take?: number },
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId },
    select: {
      id: true,
      name: true,
      deletedAt: true,
      variants: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, unit: true, stock: true },
      },
    },
  });
  if (!product) return null;

  const movements = await prisma.stockMovement.findMany({
    where: { storeId, variant: { productId } },
    orderBy: { createdAt: "desc" },
    take: options?.take ?? 200,
    select: {
      id: true,
      type: true,
      quantity: true,
      stockAfter: true,
      note: true,
      createdAt: true,
      variant: { select: { name: true, unit: true } },
      user: { select: { name: true } },
      transaction: { select: { id: true, invoiceNo: true } },
    },
  });

  return {
    product: {
      ...product,
      variants: product.variants.map((v) => ({ ...v, stock: fromScaled(v.stock) })),
    },
    movements: movements.map((m) => ({
      ...m,
      quantity: fromScaled(m.quantity),
      stockAfter: fromScaled(m.stockAfter),
    })),
  };
}
