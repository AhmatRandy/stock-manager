"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TransactionDetail, TransactionRow } from "@/types/transaction";

export const getTransactions = async (params?: {
  from?: string;
  to?: string;
}): Promise<TransactionRow[]> => {
  const session = await getSession();
  if (!session) return [];

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const fromDate = params?.from
    ? new Date(params.from + "T00:00:00")
    : thirtyDaysAgo;
  const toDate = params?.to ? new Date(params.to + "T23:59:59") : today;

  return prisma.transaction.findMany({
    where: {
      storeId: session.storeId,
      createdAt: { gte: fromDate, lte: toDate },
    },
    include: {
      user: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getTransactionById = async (
  id: string,
): Promise<TransactionDetail | null> => {
  const session = await getSession();
  if (!session) return null;

  return prisma.transaction.findFirst({
    where: { id, storeId: session.storeId },
    include: {
      user: { select: { name: true } },
      store: { select: { name: true, address: true, phone: true } },
      items: {
        select: {
          id: true,
          productName: true,
          variantName: true,
          price: true,
          quantity: true,
          subtotal: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
};
