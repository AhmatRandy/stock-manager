import "server-only";
import { prisma } from "@/lib/prisma";
import type { CategoryOption, CategoryWithCount } from "@/types/category";

type Paging = { page?: number; take?: number };

const toSkipTake = (options?: Paging, defaultTake = 100) => {
  const take = options?.take ?? defaultTake;
  const page = options?.page && options.page > 0 ? options.page : 1;
  return { skip: (page - 1) * take, take };
};

export const getCategories = (
  storeId: string,
  options?: Paging,
): Promise<CategoryWithCount[]> =>
  prisma.category.findMany({
    where: { storeId },
    include: {
      _count: { select: { products: { where: { deletedAt: null } } } },
    },
    orderBy: { name: "asc" },
    ...toSkipTake(options),
  });

export const getCategoryOptions = (
  storeId: string,
  options?: Paging,
): Promise<CategoryOption[]> =>
  prisma.category.findMany({
    where: { storeId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    ...toSkipTake(options),
  });
