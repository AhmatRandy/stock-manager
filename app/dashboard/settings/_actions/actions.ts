"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/store";
import { ACCESS, authorizeAction } from "@/lib/auth";

const settingsSchema = z.object({
  name: z
    .string()
    .min(1, "Nama toko wajib diisi")
    .max(100, "Nama toko maksimal 100 karakter")
    .trim(),
  address: z.string().max(255).trim().optional(),
  phone: z
    .string()
    .max(20, "Nomor telepon maksimal 20 karakter")
    .trim()
    .optional(),
  currency: z.string().min(1).max(10).default("IDR"),
  taxPercent: z.coerce
    .number()
    .min(0, "Pajak minimal 0%")
    .max(100, "Pajak maksimal 100%")
    .default(0),
  receiptHeader: z.string().max(500).trim().optional(),
  receiptFooter: z.string().max(500).trim().optional(),
});

export async function updateStoreSettings(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await authorizeAction(
    ACCESS.settings,
    "Hanya OWNER yang dapat mengubah pengaturan toko",
  );
  if (!auth.ok) return { success: false, message: auth.message };
  const { session } = auth;

  const raw = {
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    currency: formData.get("currency") || "IDR",
    taxPercent: formData.get("taxPercent"),
    receiptHeader: formData.get("receiptHeader") || undefined,
    receiptFooter: formData.get("receiptFooter") || undefined,
  };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  await prisma.store.update({
    where: { id: session.storeId },
    data: {
      name: parsed.data.name,
      address: parsed.data.address ?? null,
      phone: parsed.data.phone ?? null,
      currency: parsed.data.currency,
      taxPercent: parsed.data.taxPercent,
      receiptHeader: parsed.data.receiptHeader ?? null,
      receiptFooter: parsed.data.receiptFooter ?? null,
    },
  });

  revalidatePath("/dashboard/settings");

  return { success: true, message: "Pengaturan toko berhasil disimpan" };
}
