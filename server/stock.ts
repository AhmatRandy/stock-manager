import "server-only";
import type { $Enums, Prisma } from "@/prisma/client/client";

type Tx = Prisma.TransactionClient;

export class StockError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "INSUFFICIENT",
    readonly currentStock = 0,
  ) {
    super(
      code === "NOT_FOUND" ? "Varian tidak ditemukan" : "Stok tidak mencukupi",
    );
  }
}

export async function applyStockDelta(
  tx: Tx,
  input: {
    storeId: string;
    variantId: string;
    delta: number;
    type: $Enums.StockMovementType;
    userId?: string | null;
    transactionId?: string | null;
    note?: string | null;
  },
): Promise<number> {
  const { storeId, variantId, delta } = input;

  const updated = await tx.productVariant.updateManyAndReturn({
    where: {
      id: variantId,
      deletedAt: null,
      product: { storeId, deletedAt: null },
      ...(delta < 0 ? { stock: { gte: -delta } } : {}),
    },
    data: { stock: { increment: delta } },
    select: { stock: true },
  });

  if (updated.length === 0) {
    const current = await tx.productVariant.findFirst({
      where: {
        id: variantId,
        deletedAt: null,
        product: { storeId, deletedAt: null },
      },
      select: { stock: true },
    });
    throw current
      ? new StockError("INSUFFICIENT", current.stock)
      : new StockError("NOT_FOUND");
  }

  const stockAfter = updated[0].stock;
  await tx.stockMovement.create({
    data: {
      storeId,
      variantId,
      type: input.type,
      quantity: delta,
      stockAfter,
      userId: input.userId ?? null,
      transactionId: input.transactionId ?? null,
      note: input.note ?? null,
    },
  });

  return stockAfter;
}

/** Catat stok awal varian yang baru dibuat (stok sudah tersimpan di varian). */
export async function recordInitialStock(
  tx: Tx,
  storeId: string,
  userId: string,
  variants: { id: string; stock: number }[],
) {
  const data = variants
    .filter((v) => v.stock !== 0)
    .map((v) => ({
      storeId,
      variantId: v.id,
      type: "INITIAL" as const,
      quantity: v.stock,
      stockAfter: v.stock,
      userId,
      note: "Stok awal",
    }));
  if (data.length > 0) await tx.stockMovement.createMany({ data });
}
