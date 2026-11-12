import { requirePageSession } from "@/lib/auth";
import { getTransactions } from "@/server/queries/transaction";
import { TransactionsClient } from "./_components/transactions-client";

interface Props {
  searchParams: Promise<{
    from?: string;
    to?: string;
    page?: string;
    take?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const session = await requirePageSession();

  const { from, to, page, take } = await searchParams;
  const pageNum = page ? Math.max(1, Number(page) || 1) : 1;
  const takeNum = take ? Math.max(1, Number(take) || 50) : 50;

  // request one extra to detect hasNext
  const rows = await getTransactions(session.storeId, {
    from,
    to,
    page: pageNum,
    take: takeNum + 1,
  });
  const hasNext = rows.length > takeNum;
  const transactions = hasNext ? rows.slice(0, takeNum) : rows;

  return (
    <TransactionsClient
      transactions={transactions}
      defaultFrom={from}
      defaultTo={to}
      page={pageNum}
      take={takeNum}
      hasNext={hasNext}
    />
  );
}
