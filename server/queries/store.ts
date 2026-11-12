import "server-only";
import { prisma } from "@/lib/prisma";
import type { StoreData } from "@/types/store";

export const getStore = (storeId: string): Promise<StoreData | null> =>
  prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      currency: true,
      taxPercent: true,
      receiptHeader: true,
      receiptFooter: true,
    },
  });
