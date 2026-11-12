import { requirePageSession } from "@/lib/auth";
import { getPosProducts } from "@/server/queries/product";
import { PosClient } from "./_components/pos-client";

interface Props {
  searchParams: Promise<{
    page?: string;
    take?: string;
    search?: string;
  }>;
}

export default async function PosPage({ searchParams }: Props) {
  const session = await requirePageSession();

  const { page, take, search } = await searchParams;
  const pageNum = page ? Math.max(1, Number(page) || 1) : 1;
  const takeNum = take ? Math.max(1, Number(take) || 100) : 100;

  // request one extra to detect hasNext
  const rows = await getPosProducts(session.storeId, {
    page: pageNum,
    take: takeNum + 1,
    search: search ?? undefined,
  });

  const hasNext = rows.length > takeNum;
  const products = hasNext ? rows.slice(0, takeNum) : rows;

  return (
    <PosClient
      products={products}
      cashierName={session.name}
      page={pageNum}
      take={takeNum}
      hasNext={hasNext}
      searchQuery={search ?? ""}
    />
  );
}
