"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type CartItemPayload = {
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
};

export type CheckoutState = {
  success: boolean;
  message?: string;
  invoiceNo?: string;
};

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        productName: z.string().min(1),
        variantName: z.string().min(1),
        price: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Keranjang tidak boleh kosong"),
  payment: z.number().int().positive("Nominal bayar harus diisi"),
  discount: z.number().int().min(0).default(0),
});

// ─── Invoice Generator ────────────────────────────────────────────────────────

function generateInvoiceNo(): string {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const ms = String(now.getTime()).slice(-6);
  return `INV-${ymd}-${ms}`;
}

// ─── Checkout Action (ATOMIC) ─────────────────────────────────────────────────
//
// Urutan di dalam satu prisma.$transaction():
//   1. Lock + validasi stok setiap variant  (updateMany dengan WHERE stock >= qty)
//   2. Buat Transaction
//   3. Buat TransactionItem
//
// Kalau salah satu step gagal (misal stok kurang dari qty saat double-click),
// semua diroll-back otomatis → stok TIDAK bisa minus.

export async function checkoutAction(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Sesi habis, silakan login ulang" };
  }

  // ── 2. Parse payload ───────────────────────────────────────────────────────
  let raw: unknown;
  try {
    raw = JSON.parse(formData.get("payload") as string);
  } catch {
    return { success: false, message: "Payload tidak valid" };
  }

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    // Zod v4 uses .issues; fall back to .errors for older versions
    const issues =
      (parsed.error as any).issues ?? (parsed.error as any).errors ?? [];
    const firstError = issues[0]?.message ?? "Data tidak valid";
    return { success: false, message: firstError };
  }

  const { items, payment, discount } = parsed.data;

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const grandTotal = Math.max(0, total - discount);

  if (payment < grandTotal) {
    return {
      success: false,
      message: `Nominal bayar (${payment.toLocaleString("id-ID")}) kurang dari total (${grandTotal.toLocaleString("id-ID")})`,
    };
  }

  const change = payment - grandTotal;
  const invoiceNo = generateInvoiceNo();

  try {
    await prisma.$transaction(async (tx) => {
      // Step A: Decrement stok setiap variant HANYA jika stok mencukupi.
      //         updateMany dengan WHERE stock >= qty adalah teknik "optimistic lock"
      //         yang aman dari double-click dan concurrent request.
      for (const item of items) {
        const result = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: item.quantity }, // ← KUNCI: hanya update kalau stok cukup
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (result.count === 0) {
          // Bisa jadi stok memang 0, atau sudah di-decrement request lain
          // Fetch nama variant untuk pesan error yang jelas
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { name: true, stock: true },
          });
          const namaVariant = variant
            ? `${item.productName} (${variant.name}) — stok tersisa ${variant.stock}`
            : item.variantName;
          throw new Error(`Stok tidak mencukupi: ${namaVariant}`);
        }
      }

      // Step B: Buat Transaction + TransactionItems dalam satu operasi nested
      await tx.transaction.create({
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
            create: items.map((item) => ({
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              price: item.price,
              quantity: item.quantity,
              subtotal: item.price * item.quantity,
            })),
          },
        },
      });
    });

    return { success: true, invoiceNo };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi";
    return { success: false, message };
  }
}

// ─── Load Products for POS ────────────────────────────────────────────────────

export async function getPosProducts(storeId: string) {
  return prisma.product.findMany({
    where: { storeId },
    include: {
      variants: {
        orderBy: { price: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}
