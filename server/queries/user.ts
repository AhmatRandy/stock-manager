import "server-only";
import { prisma } from "@/lib/prisma";
import type { UserRow } from "@/types/user";

export const getUsers = (
  storeId: string,
  options?: { page?: number; take?: number },
): Promise<UserRow[]> => {
  const take = options?.take ?? 100;
  const page = options?.page && options.page > 0 ? options.page : 1;
  const skip = (page - 1) * take;

  return prisma.user.findMany({
    where: { storeId, deletedAt: null },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    skip,
    take,
  }) as Promise<UserRow[]>;
};
