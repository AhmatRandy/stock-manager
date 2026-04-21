"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { toScaled, fromScaled, validateQuantity } from "@/lib/stock";
import { CheckoutState, QuantityType } from "@/types/product";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        productName: z.string().min(1),
        variantName: z.string().min(1),
        price: z.number().int().positive(),
        quantity: z.number().positive(),
      }),
    )
    .min(1, "Keranjang tidak boleh kosong"),
  payment: z.number().int().positive("Nominal bayar harus diisi"),
  discount: z.number().int().min(0).default(0),
});

function generateInvoiceNo(): string {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const ms = String(now.getTime()).slice(-6);
  return `INV-${ymd}-${ms}`;
}

export async function checkoutAction(
  _prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Sesi habis, silakan login ulang" };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(formData.get("payload") as string);
  } catch {
    return { success: false, message: "Payload tidak valid" };
  }

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const issues =
      (parsed.error as any).issues ?? (parsed.error as any).errors ?? [];
    const firstError = issues[0]?.message ?? "Data tidak valid";
    return { success: false, message: firstError };
  }

  const { items, payment, discount } = parsed.data;

  for (const item of items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
      select: {
        name: true,
        unit: true,
        stock: true,
        quantityType: true,
        step: true,
        minOrder: true,
      },
    });

    if (!variant) {
      return {
        success: false,
        message: `Produk tidak ditemukan: ${item.variantName}`,
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
        message: `${item.productName} (${item.variantName}): ${result.message}`,
      };
    }
  }

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
      for (const item of items) {
        const scaledQty = toScaled(item.quantity);

        const result = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: scaledQty },
          },
          data: {
            stock: { decrement: scaledQty },
          },
        });

        if (result.count === 0) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { name: true, stock: true, unit: true },
          });
          const sisaStok = variant
            ? `${fromScaled(variant.stock)} ${variant.unit}`
            : "0";
          const namaVariant = variant
            ? `${item.productName} (${variant.name}) — stok tersisa ${sisaStok}`
            : item.variantName;
          throw new Error(`Stok tidak mencukupi: ${namaVariant}`);
        }
      }

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
              quantity: toScaled(item.quantity),
              subtotal: Math.round(item.price * item.quantity),
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

export async function getPosProducts(
  storeId: string,
  options?: { take?: number; page?: number; search?: string },
) {
  const take = options?.take ?? 100;
  const page = options?.page && options.page > 0 ? options.page : 1;
  const skip = (page - 1) * take;

  const where: any = { storeId };
  if (options?.search && options.search.trim() !== "") {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      {
        variants: {
          some: { name: { contains: options.search, mode: "insensitive" } },
        },
      },
    ];
  }

  const rows = await prisma.product.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
      variants: { orderBy: { price: "asc" } },
    },
    orderBy: { name: "asc" },
    skip,
    take,
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
}
