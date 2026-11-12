"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeAction } from "@/lib/auth";
import { toScaled, fromScaled, validateQuantity } from "@/lib/stock";
import { applyStockDelta, StockError } from "@/server/stock";
import { CheckoutState, QuantityType } from "@/types/product";

// Hanya variantId & quantity yang dipercaya dari client. Harga dan nama
// produk/varian selalu diambil dari database (field lain di payload diabaikan).
const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().positive(),
      }),
    )
    .min(1, "Keranjang tidak boleh kosong"),
  payment: z.number().int().positive("Nominal bayar harus diisi"),
  discount: z.number().int().min(0).default(0),
});

const STORE_TIMEZONE = "Asia/Jakarta";

const invoiceDateKey = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: STORE_TIMEZONE })
    .format(date)
    .replace(/-/g, "");

export async function checkoutAction(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const auth = await authorizeAction();
  if (!auth.ok) return { success: false, message: auth.message };
  const { session } = auth;

  let raw: unknown;
  try {
    raw = JSON.parse(formData.get("payload") as string);
  } catch {
    return { success: false, message: "Payload tidak valid" };
  }

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, message: firstError };
  }

  const { items, payment, discount } = parsed.data;

  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: [...new Set(items.map((i) => i.variantId))] },
      deletedAt: null,
      product: { storeId: session.storeId, deletedAt: null },
    },
    select: {
      id: true,
      name: true,
      unit: true,
      price: true,
      stock: true,
      quantityType: true,
      step: true,
      minOrder: true,
      product: { select: { name: true } },
    },
  });
  const variantById = new Map(variants.map((v) => [v.id, v]));

  const lines: Array<{
    variantId: string;
    productName: string;
    variantName: string;
    unit: string;
    price: number;
    quantity: number;
    subtotal: number;
  }> = [];
  for (const item of items) {
    const variant = variantById.get(item.variantId);
    if (!variant) {
      return {
        success: false,
        message: "Produk tidak ditemukan, silakan muat ulang halaman",
      };
    }

    const result = validateQuantity(item.quantity, {
      quantityType: variant.quantityType as QuantityType,
      step: fromScaled(variant.step),
      minOrder: fromScaled(variant.minOrder),
      stock: fromScaled(variant.stock),
      unit: variant.unit,
    });

    if (!result.valid) {
      return {
        success: false,
        message: `${variant.product.name} (${variant.name}): ${result.message}`,
      };
    }

    lines.push({
      variantId: variant.id,
      productName: variant.product.name,
      variantName: variant.name,
      unit: variant.unit,
      price: variant.price,
      quantity: item.quantity,
      subtotal: Math.round(variant.price * item.quantity),
    });
  }

  const total = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const grandTotal = Math.max(0, total - discount);

  if (payment < grandTotal) {
    return {
      success: false,
      message: `Nominal bayar (${payment.toLocaleString("id-ID")}) kurang dari total (${grandTotal.toLocaleString("id-ID")})`,
    };
  }

  const change = payment - grandTotal;
  const dateKey = invoiceDateKey(new Date());

  // Baris yang sedang diproses, untuk pesan error stok yang jelas.
  let currentLine: (typeof lines)[number] | undefined;

  try {
    const invoiceNo = await prisma.$transaction(
      async (tx) => {
        const counter = await tx.invoiceCounter.upsert({
          where: { storeId_date: { storeId: session.storeId, date: dateKey } },
          create: { storeId: session.storeId, date: dateKey, last: 1 },
          update: { last: { increment: 1 } },
          select: { last: true },
        });
        const invoiceNo = `INV-${dateKey}-${String(counter.last).padStart(4, "0")}`;

        const transaction = await tx.transaction.create({
          data: {
            invoiceNo,
            total,
            discount,
            grandTotal,
            payment,
            change,
            storeId: session.storeId,
            userId: session.id,
            items: {
              create: lines.map((line) => ({
                variantId: line.variantId,
                productName: line.productName,
                variantName: line.variantName,
                price: line.price,
                quantity: toScaled(line.quantity),
                subtotal: line.subtotal,
              })),
            },
          },
          select: { id: true },
        });

        for (const line of lines) {
          currentLine = line;
          await applyStockDelta(tx, {
            storeId: session.storeId,
            variantId: line.variantId,
            delta: -toScaled(line.quantity),
            type: "SALE",
            userId: session.id,
            transactionId: transaction.id,
          });
        }

        return invoiceNo;
      },
      { timeout: 20_000 },
    );

    return { success: true, invoiceNo };
  } catch (err) {
    if (err instanceof StockError && currentLine) {
      const label = `${currentLine.productName} (${currentLine.variantName})`;
      return {
        success: false,
        message:
          err.code === "INSUFFICIENT"
            ? `Stok tidak mencukupi: ${label} — stok tersisa ${fromScaled(err.currentStock)} ${currentLine.unit}`
            : `Produk tidak ditemukan: ${label}, silakan muat ulang halaman`,
      };
    }
    console.error("checkoutAction gagal:", err);
    return { success: false, message: "Terjadi kesalahan, coba lagi" };
  }
}
