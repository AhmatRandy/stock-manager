import "server-only";
import { prisma } from "@/lib/prisma";
import type { TransactionDetail, TransactionRow } from "@/types/transaction";

export const getTransactions = (
  storeId: string,
  params?: { from?: string; to?: string; page?: number; take?: number },
): Promise<TransactionRow[]> => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const fromDate = params?.from
    ? new Date(params.from + "T00:00:00")
    : thirtyDaysAgo;
  const toDate = params?.to ? new Date(params.to + "T23:59:59") : today;

  const take = params?.take ?? 50;
  const page = params?.page && params.page > 0 ? params.page : 1;
  const skip = (page - 1) * take;

  return prisma.transaction.findMany({
    where: {
      storeId,
      createdAt: { gte: fromDate, lte: toDate },
    },
    include: {
      user: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
};

export const getTransactionById = (
  storeId: string,
  id: string,
): Promise<TransactionDetail | null> =>
  prisma.transaction.findFirst({
    where: { id, storeId },
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
